<?php

namespace App\Http\Controllers;

use App\Models\Athlete;
use App\Models\RegisteredPlayer;
use App\Models\Event;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AthleteController extends Controller
{
    /**
     * Display MIS Dashboard with athlete data
     */
    public function index(Request $request)
    {
        $query = Athlete::query();

        // Apply filters
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('student_id', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->filled('department')) {
            $query->where('department', $request->department);
        }

        if ($request->filled('year_level')) {
            $query->where('year_level', $request->year_level);
        }

        if ($request->filled('scholarship_status')) {
            $query->where('scholarship_status', $request->scholarship_status);
        }

        if ($request->filled('sport_team')) {
            $query->where('sport_team', $request->sport_team);
        }

        $athletes = $query->orderBy('created_at', 'desc')->paginate(20);

        // Get filter options
        $departments = Athlete::select('department')->distinct()->pluck('department');
        $yearLevels = Athlete::select('year_level')->whereNotNull('year_level')->distinct()->pluck('year_level');
        $sportTeams = Athlete::select('sport_team')->whereNotNull('sport_team')->distinct()->pluck('sport_team');

        // Get statistics
        $stats = [
            'total_athletes' => Athlete::count(),
            'by_department' => Athlete::select('department', DB::raw('count(*) as count'))
                ->groupBy('department')
                ->get(),
            'by_year_level' => Athlete::select('year_level', DB::raw('count(*) as count'))
                ->whereNotNull('year_level')
                ->groupBy('year_level')
                ->get(),
            'by_scholarship' => Athlete::select('scholarship_status', DB::raw('count(*) as count'))
                ->whereNotNull('scholarship_status')
                ->groupBy('scholarship_status')
                ->get(),
            'average_gpa' => round(Athlete::whereNotNull('gpa')->avg('gpa'), 2),
            'total_enrolled_units' => Athlete::sum('enrolled_units'),
        ];

        return Inertia::render('MIS/Dashboard', [
            'athletes' => $athletes,
            'stats' => $stats,
            'filters' => [
                'departments' => $departments,
                'yearLevels' => $yearLevels,
                'sportTeams' => $sportTeams,
            ],
            'queryParams' => $request->only(['search', 'department', 'year_level', 'scholarship_status', 'sport_team']),
        ]);
    }

    /**
     * Show the form for creating a new athlete
     */
    public function create()
    {
        return Inertia::render('MIS/CreateAthlete');
    }

    /**
     * Store a newly created athlete
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'student_id' => 'required|string|max:255|unique:athletes,student_id',
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:athletes,email',
            'department' => 'required|string|max:255',
            'course' => 'nullable|string|max:255',
            'year_level' => 'nullable|string|max:50',
            'contact_number' => 'nullable|string|max:50',
            'age' => 'required|integer|min:1|max:150',
            'gpa' => 'nullable|numeric|min:0|max:4',
            'enrolled_units' => 'nullable|integer|min:0',
            'scholarship_status' => 'nullable|string|max:255',
            'sport_team' => 'nullable|string|max:255',
            'team_name' => 'nullable|string|max:255',
            'gdrive_link' => 'nullable|url',
        ]);

        $validated['status'] = 'active';
        $validated['registered_at'] = now();

        Athlete::create($validated);

        return redirect()->route('mis.dashboard')->with('success', 'Athlete profile created successfully!');
    }

    /**
     * Display the specified athlete
     */
    public function show($id)
    {
        $athlete = Athlete::with('eventRegistrations.event')->findOrFail($id);
        
        return Inertia::render('MIS/ShowAthlete', [
            'athlete' => $athlete,
        ]);
    }

    /**
     * Show the form for editing the specified athlete
     */
    public function edit($id)
    {
        $athlete = Athlete::findOrFail($id);
        
        return Inertia::render('MIS/EditAthlete', [
            'athlete' => $athlete,
        ]);
    }

    /**
     * Update the specified athlete
     */
    public function update(Request $request, $id)
    {
        $athlete = Athlete::findOrFail($id);

        $validated = $request->validate([
            'student_id' => 'required|string|max:255|unique:athletes,student_id,' . $id,
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:athletes,email,' . $id,
            'department' => 'required|string|max:255',
            'course' => 'nullable|string|max:255',
            'year_level' => 'nullable|string|max:50',
            'contact_number' => 'nullable|string|max:50',
            'age' => 'required|integer|min:1|max:150',
            'gpa' => 'nullable|numeric|min:0|max:4',
            'enrolled_units' => 'nullable|integer|min:0',
            'scholarship_status' => 'nullable|string|max:255',
            'sport_team' => 'nullable|string|max:255',
            'team_name' => 'nullable|string|max:255',
            'gdrive_link' => 'nullable|url',
            'status' => 'required|in:active,inactive,graduated',
        ]);

        $athlete->update($validated);

        return redirect()->route('mis.dashboard')->with('success', 'Athlete profile updated successfully!');
    }

    /**
     * Remove the specified athlete
     */
    public function destroy($id)
    {
        $athlete = Athlete::findOrFail($id);
        $athlete->delete();

        return redirect()->route('mis.dashboard')->with('success', 'Athlete profile deleted successfully!');
    }

    /**
     * Export athlete data as CSV
     */
    public function exportCsv(Request $request)
    {
        $query = Athlete::query();

        // Apply same filters as index
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('student_id', 'like', "%{$search}%");
            });
        }

        if ($request->filled('department')) {
            $query->where('department', $request->department);
        }

        $filename = "athlete_data_" . now()->format('Y-m-d_His') . ".csv";
        
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename={$filename}",
        ];

        $callback = function() use ($query) {
            $file = fopen('php://output', 'w');
            
            fputcsv($file, [
                'Student ID', 'Name', 'Email', 'Contact Number', 'Department', 
                'Course', 'Year Level', 'Age', 'GPA', 'Enrolled Units', 
                'Scholarship Status', 'Sport/Team', 'Team Name', 'Status'
            ]);

            $query->chunk(100, function($athletes) use ($file) {
                foreach($athletes as $athlete) {
                    fputcsv($file, [
                        $athlete->student_id,
                        $athlete->name,
                        $athlete->email,
                        $athlete->contact_number ?? 'N/A',
                        $athlete->department,
                        $athlete->course ?? 'N/A',
                        $athlete->year_level ?? 'N/A',
                        $athlete->age,
                        $athlete->gpa ?? 'N/A',
                        $athlete->enrolled_units ?? 'N/A',
                        $athlete->scholarship_status ?? 'N/A',
                        $athlete->sport_team ?? 'N/A',
                        $athlete->team_name ?? 'N/A',
                        $athlete->status,
                    ]);
                }
            });
            
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
