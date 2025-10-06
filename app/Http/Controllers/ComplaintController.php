<?php

namespace App\Http\Controllers;

use App\Models\Complaint;
use App\Models\Event;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ComplaintController extends Controller
{
    // Public form to submit complaints
    public function index()
    {
        $events = Event::where('event_date', '>=', now()->subDay())
            ->orderBy('event_date')
            ->select('id', 'title', 'event_date')
            ->get();
        
        return Inertia::render('Complaints/PublicComplaintForm', [
            'events' => $events
        ]);
    }

    // Admin view to manage complaints
    public function adminIndex()
    {
        $complaints = Complaint::with('event')->latest()->get();
        
        return Inertia::render('Complaints/AdminComplaints', [
            'complaints' => $complaints
        ]);
    }

    // Store a new complaint
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'block' => 'required|string|max:255',
            'department' => 'required|string|max:255',
            'complaint_letter' => 'required|string',
            'event_id' => 'required|exists:events,id',
        ]);

        Complaint::create($validated);

        return redirect()->back()->with('success', 'Thank you for your complaint. We will review it shortly.');
    }

    // Delete a complaint (admin only)
    public function destroy(Complaint $complaint)
    {
        $complaint->delete();
        return redirect()->back()->with('success', 'Complaint deleted successfully!');
    }
}
