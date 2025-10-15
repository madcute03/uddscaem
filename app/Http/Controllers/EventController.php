<?php

namespace App\Http\Controllers;

use App\Models\Event;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Carbon;

class EventController extends Controller
{
    /**
     * Ensure events that have passed their end date (or start date if no end) are marked done.
     */
    protected function updateCompletedEvents(): void
    {
        $today = now()->toDateString();
        // Events with end date in the past
        Event::whereNotNull('event_end_date')
            ->whereDate('event_end_date', '<', $today)
            ->where('is_done', false)
            ->update(['is_done' => true]);

        // Events without end date: mark done if start date in the past
        Event::whereNull('event_end_date')
            ->whereDate('event_date', '<', $today)
            ->where('is_done', false)
            ->update(['is_done' => true]);
    }
    // ADMIN: Dashboard (list all events)
    /**
     * Get summary data for the dashboard
     *
     * @return \Inertia\Response
     */
    public function summary()
    {
        // Get counts for different event statuses
        $totalEvents = Event::count();
        $ongoingEvents = Event::where('event_date', '<=', now())
            ->where(function($query) {
                $query->where('event_end_date', '>=', now())
                      ->orWhereNull('event_end_date');
            })
            ->where('is_done', false)
            ->count();

        $upcomingEvents = Event::where('event_date', '>', now())
            ->where('is_done', false)
            ->count();

        // Get recent events for the dashboard
        $recentEvents = Event::select(
                'id',
                'title as name',
                'event_date as date',
                'event_end_date as end_date',
                'venue',
                'is_done'
            )
            ->orderBy('event_date', 'desc')
            ->get()
            ->map(function($event) {
                return [
                    'id' => $event->id,
                    'name' => $event->name,
                    'date' => $event->date,
                    'end_date' => $event->end_date,
                    'venue' => $event->venue,
                    'is_done' => $event->is_done,
                    'status' => $event->is_done ? 'Completed' : 
                               ($event->date <= now() ? 'Ongoing' : 'Upcoming')
                ];
            });

        return Inertia::render('DashboardSummary', [
            'stats' => [
                'total_events' => $totalEvents,
                'ongoing_events' => $ongoingEvents,
                'upcoming_events' => $upcomingEvents,
            ],
            'recentEvents' => $recentEvents,
            'loading' => false
        ]);
    }

    /**
     * Show the dashboard with all events
     *
     * @return \Inertia\Response
     */
    public function dashboard()
    {
        // Auto-mark completed events before fetching
        $this->updateCompletedEvents();
        $events = Event::select(
            'id',
            'title',
            'description',
            'coordinator_name',
            'venue',
            'participants',
            'event_type',
            'category',
            'other_category',
            'event_date',
            'event_end_date',
            'registration_end_date',
            'has_registration_end_date',
            'registration_type',
            'team_size',
            'required_players',
            'is_done',
            'allow_bracketing',
            'rulebook_path'
        )
            ->with('images')
            ->orderBy('event_date')
            ->get();

        // Set has_registration_end_date based on whether registration_end_date is set
        $events->each(function ($event) {
            $event->has_registration_end_date = !is_null($event->registration_end_date);
        });

        // Map image paths for frontend convenience (use absolute URLs matching request scheme/host)
        $base = rtrim(request()->getSchemeAndHttpHost(), '/');
        $events->transform(function ($event) use ($base) {
            $event->images_path = $event->images->map(function ($img) use ($base) {
                return $base . '/storage/' . ltrim($img->image_path, '/');
            });
            return $event;
        });

        return Inertia::render('DashboardEvents', [
            'events' => $events,
        ]);
    }

    // ADMIN: Show CreateEvent page
    public function index()
    {
        // Auto-mark completed events before fetching
        $this->updateCompletedEvents();
        $events = Event::select(
            'id',
            'title',
            'description',
            'coordinator_name',
            'venue',
            'participants',
            'event_type',
            'event_date',
            'registration_end_date',
            'has_registration_end_date',
            'registration_type',
            'team_size',
            'required_players',
            'is_done',
            'allow_bracketing',
            'category',
            'other_category',
            'rulebook_path'
        )
            ->with('images')
            ->orderBy('event_date')
            ->get();

        // Map image paths for frontend (use absolute URLs matching request scheme/host)
        $base = rtrim(request()->getSchemeAndHttpHost(), '/');
        $events->transform(function ($event) use ($base) {
            $event->images_path = $event->images->map(function ($img) use ($base) {
                return $base . '/storage/' . ltrim($img->image_path, '/');
            });
            return $event;
        });

        return Inertia::render('CreateEvent', [
            'events' => $events,
        ]);
    }

    // PUBLIC: View a single event
    public function show(Event $event)
    {
        // Ensure up-to-date done status when viewing an event
        $this->updateCompletedEvents();
        $event->load('images');
        $base = rtrim(request()->getSchemeAndHttpHost(), '/');
        $event->images_path = $event->images->map(function ($img) use ($base) {
            return $base . '/storage/' . ltrim($img->image_path, '/');
        });

        return Inertia::render('ShowEvent', [
            'event' => $event,
        ]);
    }

    // ADMIN: Create a new event
    public function store(Request $request)
    {
        // Validate the request data
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'coordinator_name' => 'required|string|max:255',
            'venue' => 'nullable|string|max:255',
            'participants' => 'nullable|array',
            'participants.*' => 'nullable|string|max:255',
            'category' => 'required|string|in:sport,culture,arts,intramurals,other',
            'other_category' => 'required_if:category,other|string|max:255|nullable',
            'event_type' => 'required|string|max:255',
            'other_event_type' => 'nullable|string|max:255',
            'event_date' => 'required|date',
            'event_end_date' => 'nullable|date',
            'registration_end_date' => 'nullable|date',
            'has_registration_end_date' => 'sometimes|boolean',
            'registration_type' => 'nullable|in:single,team',
            'team_size' => 'nullable|integer|min:2|max:50',
            'required_players' => 'nullable|integer|min:1|max:20',
            'allow_bracketing' => 'sometimes|boolean',
            'images' => 'nullable|array',
            'images.*' => 'image|mimes:jpeg,png,jpg,gif|max:2048',
            'rulebook' => 'nullable|file|mimes:pdf,doc,docx,txt|max:5120',
        ]);

        // Handle the registration end date based on the toggle
        if (!($validated['has_registration_end_date'] ?? false)) {
            $validated['registration_end_date'] = null;
        }

        // Set defaults for tryouts events
        if ($validated['event_type'] === 'tryouts') {
            $validated['has_registration_end_date'] = $validated['has_registration_end_date'] ?? true;
            $validated['registration_type'] = $validated['registration_type'] ?? 'single';
            $validated['required_players'] = $validated['required_players'] ?? 1;
        }

        // Handle custom event type and category
        $eventType = $validated['event_type'];
        if ($eventType === 'other' && !empty($validated['other_event_type'])) {
            $eventType = $validated['other_event_type'];
        }
        
        // Handle custom category
        $category = $validated['category'];
        if ($category === 'other' && !empty($validated['other_category'])) {
            $category = $validated['other_category'];
        }

        $participants = collect($request->input('participants', []))
            ->map(fn ($participant) => is_string($participant) ? trim($participant) : '')
            ->filter(fn ($participant) => $participant !== '')
            ->values()
            ->all();

        // Create the event
        $event = Event::create([
            'title' => $validated['title'],
            'description' => $validated['description'],
            'coordinator_name' => $validated['coordinator_name'],
            'venue' => $validated['venue'] ?? null,
            'participants' => $participants,
            'category' => $category,
            'other_category' => $validated['other_category'] ?? null,
            'event_type' => $eventType,
            'event_date' => $validated['event_date'],
            'event_end_date' => $validated['event_end_date'] ?? null,
            'registration_end_date' => $validated['registration_end_date'] ?? null,
            'has_registration_end_date' => $validated['has_registration_end_date'] ?? false,
            'registration_type' => $validated['registration_type'] ?? 'single',
            'team_size' => $validated['team_size'] ?? null,
            'required_players' => $validated['required_players'] ?? null,
            'allow_bracketing' => $validated['allow_bracketing'] ?? false,
            'is_done' => false,
        ]);

        // Handle file uploads
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $image) {
                if ($image->isValid()) {
                    $path = $image->store('events', 'public');
                    $event->images()->create(['image_path' => $path]);
                }
            }
        }

        // Handle rulebook file upload
        if ($request->hasFile('rulebook')) {
            $rulebook = $request->file('rulebook');
            if ($rulebook->isValid()) {
                $rulebookPath = $rulebook->store('rulebooks', 'public');
                $event->update(['rulebook_path' => $rulebookPath]);
            }
        }

        // Redirect to dashboard so the new event appears immediately
        return redirect()->route('dashboard')->with('success', 'Event created successfully.');
    }

    // ADMIN: Update an event with existing images support
    public function update(Request $request, $id)
    {
        try {
            Log::info('Update request received', $request->except('images'));
            Log::info('Files received:', array_map(function($file) {
                return [
                    'name' => $file->getClientOriginalName(),
                    'size' => $file->getSize(),
                    'mime' => $file->getMimeType(),
                ];
            }, $request->file('images', [])));
            
            $event = Event::findOrFail($id);

            $rules = [
                'title' => 'required|string|max:255',
                'description' => 'required|string',
                'coordinator_name' => 'required|string|max:255',
                'venue' => 'nullable|string|max:255',
                'participants' => 'nullable|array',
                'participants.*' => 'nullable|string|max:255',
                'category' => 'required|string|in:sport,culture,arts,intramurals,other',
                'other_category' => 'required_if:category,other|string|max:255|nullable',
                'event_type' => 'required|string|max:255',
                'event_date' => 'required|date',
                'event_end_date' => 'nullable|date|after_or_equal:event_date',
                'has_registration_end_date' => 'sometimes|boolean',
                'registration_type' => 'required_if:has_registration_end_date,true|in:single,team',
                'team_size' => 'required_if:registration_type,team|nullable|integer|min:2|max:50',
                'registration_end_date' => 'nullable|date|required_if:has_registration_end_date,1',
                'required_players' => 'nullable|integer|min:1|max:20',
                'images' => 'nullable|array',
                'images.*' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
                'rulebook' => 'nullable|file|mimes:pdf,doc,docx,txt|max:5120',
                'allow_bracketing' => 'sometimes|boolean',
                'existing_images' => 'nullable|array',
                'existing_images.*' => 'string',
            ];

            $validator = Validator::make($request->all(), $rules);

            if ($validator->fails()) {
                Log::error('Validation failed', $validator->errors()->toArray());
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $data = $validator->validated();

            // Handle custom event type and category
            $eventType = $data['event_type'];
            if ($eventType === 'other' && !empty($data['other_event_type'])) {
                $eventType = $data['other_event_type'];
            }
            
            // Handle custom category
            $category = $data['category'];
            if ($category === 'other' && !empty($data['other_category'])) {
                $category = $data['other_category'];
            }

            $participants = collect($request->input('participants', []))
                ->map(fn ($participant) => is_string($participant) ? trim($participant) : '')
                ->filter(fn ($participant) => $participant !== '')
                ->values()
                ->all();

            // Update the event
            $event->update([
                'title' => $data['title'],
                'description' => $data['description'],
                'coordinator_name' => $data['coordinator_name'],
                'venue' => $data['venue'] ?? null,
                'participants' => $participants,
                'category' => $category,
                'other_category' => $data['other_category'] ?? null,
                'event_type' => $eventType,
                'event_date' => $data['event_date'],
                'event_end_date' => $data['event_end_date'] ?? null,
                'registration_end_date' => $data['has_registration_end_date'] ? ($data['registration_end_date'] ?? null) : null,
                'has_registration_end_date' => $data['has_registration_end_date'] ?? false,
                'registration_type' => $data['registration_type'] ?? 'single',
                'team_size' => $data['team_size'] ?? null,
                'required_players' => $data['required_players'] ?? null,
                'allow_bracketing' => $data['allow_bracketing'] ?? false,
            ]);

            // Handle existing images
            $existingImages = $data['existing_images'] ?? [];

            if (!empty($existingImages)) {
                $event->images()->whereNotIn('image_path', $existingImages)->each(function ($image) {
                    Log::info('Deleting image:', ['id' => $image->id, 'path' => $image->image_path]);
                    Storage::disk('public')->delete($image->image_path);
                    $image->delete();
                });
            } else {
                // If no existing images are sent, remove all existing images
                $event->images->each(function ($image) {
                    Storage::disk('public')->delete($image->image_path);
                    $image->delete();
                });
            }

        // Handle new image uploads
        if ($request->hasFile('images')) {
            Log::info('Processing new image uploads');
            foreach ($request->file('images') as $file) {
                if ($file->isValid()) {
                    $path = $file->store('events', 'public');
                    $event->images()->create(['image_path' => $path]);
                    Log::info('Uploaded new image:', ['path' => $path]);
                }
            }
        }

        // Handle rulebook file upload
        if ($request->hasFile('rulebook')) {
            $rulebook = $request->file('rulebook');
            if ($rulebook->isValid()) {
                // Delete existing rulebook if it exists
                if ($event->rulebook_path) {
                    Storage::disk('public')->delete($event->rulebook_path);
                }
                $rulebookPath = $rulebook->store('rulebooks', 'public');
                $event->update(['rulebook_path' => $rulebookPath]);
                Log::info('Uploaded new rulebook:', ['path' => $rulebookPath]);
            }
        }

            $event = $event->fresh('images');
            $successMessage = 'Event updated successfully.';

            if ($request->header('X-Inertia')) {
                return redirect()->back()->with('success', $successMessage);
            }

            if ($request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => $successMessage,
                    'event' => $event
                ]);
            }

            return redirect()->back()->with('success', $successMessage);
        } catch (\Exception $e) {
            Log::error('Error updating event: ' . $e->getMessage(), [
                'exception' => $e,
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while updating the event.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // ADMIN: Delete an event
    public function destroy($id)
    {
        try {
            $event = Event::findOrFail($id);
            
            // The model's booted() method will handle image deletion through the deleting event
            $event->delete();

            return redirect()->back()->with('success', 'Event deleted successfully.');
            
        } catch (\Exception $e) {
            \Log::error('Error deleting event: ' . $e->getMessage(), [
                'event_id' => $id,
                'trace' => $e->getTraceAsString()
            ]);
            
            return redirect()->back()
                ->with('error', 'Failed to delete event. Please try again.');
        }
    }

    // PUBLIC: Welcome page (list all events)
    public function welcome()
    {
        // Auto-mark completed events before fetching
        $this->updateCompletedEvents();
        $events = Event::select(
            'id',
            'title',
            'description',
            'coordinator_name',
            'event_type',
            'event_date',
            'registration_end_date',
            'has_registration_end_date',
            'registration_type',
            'team_size',
            'required_players',
            'is_done',
            'allow_bracketing',
            'rulebook_path'
        )
            ->with('images')
            ->orderBy('event_date')
            ->get();

        $base = rtrim(request()->getSchemeAndHttpHost(), '/');
        $events->transform(function ($event) use ($base) {
            $event->images_path = $event->images->map(function ($img) use ($base) {
                return $base . '/storage/' . ltrim($img->image_path, '/');
            });
            return $event;
        });

        return Inertia::render('Welcome', [
            'events' => $events,
        ]);
    }
    public function markDone($id)
    {
        $event = Event::findOrFail($id);
        $event->is_done = 1; // mark as done
        $event->save();

        return response()->json([
            'success' => true,
            'message' => 'Event marked as done!',
        ]);
    }
    public function markUndone($id)
    {
        $event = Event::findOrFail($id);
        $event->is_done = false;
        $event->save();

        return response()->json(['message' => 'Event marked as undone']);
    }

    /**
     * Serve rulebook file for an event
     */
    public function downloadRulebook(Event $event)
    {
        if (!$event->rulebook_path) {
            abort(404, 'Rulebook not found');
        }

        $filePath = storage_path('app/public/' . $event->rulebook_path);

        if (!file_exists($filePath)) {
            abort(404, 'Rulebook file not found');
        }

        // Get file mime type
        $mimeType = mime_content_type($filePath);

        return response()->file($filePath, [
            'Content-Type' => $mimeType ?: 'application/pdf',
            'Content-Disposition' => 'inline; filename="' . basename($event->rulebook_path) . '"',
            'Cache-Control' => 'no-cache, no-store, must-revalidate',
            'Pragma' => 'no-cache',
            'Expires' => '0',
            'Accept-Ranges' => 'bytes',
            'Content-Length' => filesize($filePath)
        ]);
    }
}
