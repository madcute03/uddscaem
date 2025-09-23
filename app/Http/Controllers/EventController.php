<?php

namespace App\Http\Controllers;

use App\Models\Event;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;

class EventController extends Controller
{
    // ADMIN: Dashboard (list all events)
    public function dashboard()
    {
        $events = Event::select(
            'id',
            'title',
            'description',
            'coordinator_name',
            'event_type',
            'event_date',
            'registration_end_date',
            'has_registration_end_date',
            'required_players',
            'is_done',
            'allow_bracketing'
        )
            ->with('images')
            ->orderBy('event_date')
            ->get();
            
        // Set has_registration_end_date based on whether registration_end_date is set
        $events->each(function ($event) {
            $event->has_registration_end_date = !is_null($event->registration_end_date);
        });

        // Map image paths for frontend convenience
        $events->transform(function ($event) {
            $event->images_path = $event->images->pluck('image_path');
            return $event;
        });

        return Inertia::render('Dashboard', [
            'events' => $events,
        ]);
    }

    // ADMIN: Show CreateEvent page
    public function index()
    {
        $events = Event::select(
            'id',
            'title',
            'description',
            'coordinator_name',
            'event_type',
            'event_date',
            'registration_end_date',
            'has_registration_end_date',
            'required_players',
            'is_done',
            'allow_bracketing'
        )
            ->with('images')
            ->orderBy('event_date')
            ->get();

        // Map image paths for frontend
        $events->transform(function ($event) {
            $event->images_path = $event->images->pluck('image_path');
            return $event;
        });

        return Inertia::render('CreateEvent', [
            'events' => $events,
        ]);
    }

    // PUBLIC: View a single event
    public function show(Event $event)
    {
        $event->load('images');
        $event->images_path = $event->images->pluck('image_path');

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
            'event_type' => 'required|string|max:255',
            'event_date' => 'required|date',
            'has_registration_end_date' => 'sometimes|boolean',
            'registration_end_date' => 'nullable|date|after_or_equal:event_date',
            'required_players' => 'nullable|integer|min:1|max:20',
            'allow_bracketing' => 'sometimes|boolean',
            'images' => 'nullable|array',
            'images.*' => 'image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        // Handle the registration end date based on the toggle
        if (!($validated['has_registration_end_date'] ?? false)) {
            $validated['registration_end_date'] = null;
        }

        // Create the event
        $event = Event::create([
            'title' => $validated['title'],
            'description' => $validated['description'],
            'coordinator_name' => $validated['coordinator_name'],
            'event_type' => $validated['event_type'],
            'event_date' => $validated['event_date'],
            'registration_end_date' => $validated['registration_end_date'] ?? null,
            'has_registration_end_date' => $validated['has_registration_end_date'] ?? false,
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

        // Redirect to dashboard so the new event appears immediately
        return redirect()->route('dashboard')->with('success', 'Event created successfully.');
    }

    // ADMIN: Update an event with existing images support
    public function update(Request $request, $id)
    {
        $event = Event::findOrFail($id);

        $data = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'coordinator_name' => 'required|string|max:255',
            'event_type' => 'required|string|max:255',
            'event_date' => 'required|date',
            'event_time' => 'required|date_format:H:i',
            'registration_end_date' => 'nullable|date',
            'registration_end_time' => 'nullable|date_format:H:i',
            'required_players' => 'nullable|integer|min:1|max:20',
            'images.*' => 'nullable|image|max:2048',
            'allow_bracketing' => 'sometimes|boolean',
            'existing_images' => 'nullable|array',
            'existing_images.*' => 'exists:event_images,id',
        ]);

        // Combine date and time for event_date
        $eventDateTime = $data['event_date'] . ' ' . ($data['event_time'] ?? '00:00:00');
        
        // Combine date and time for registration_end_date if provided
        $registrationDateTime = null;
        if (!empty($data['registration_end_date']) && !empty($data['registration_end_time'])) {
            $registrationDateTime = $data['registration_end_date'] . ' ' . $data['registration_end_time'] . ':00';
        }

        // Update event data
        $event->update([
            'title' => $data['title'],
            'description' => $data['description'],
            'coordinator_name' => $data['coordinator_name'],
            'event_type' => $data['event_type'],
            'event_date' => $eventDateTime,
            'registration_end_date' => $registrationDateTime,
            'required_players' => $data['required_players'] ?? null,
            'allow_bracketing' => $data['allow_bracketing'] ?? false,
        ]);

        // Remove deleted images
        $existingImages = $request->input('existing_images', []);
        $event->images()->whereNotIn('image_path', $existingImages)->each(function ($img) {
            Storage::disk('public')->delete($img->image_path);
            $img->delete();
        });

        // Add new uploaded images
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $file) {
                $path = $file->store('events', 'public');
                $event->images()->create(['image_path' => $path]);
            }
        }

        return redirect()->back()->with('success', 'Event updated successfully.');
    }

    // ADMIN: Delete an event
    public function destroy($id)
    {
        $event = Event::findOrFail($id);

        // Delete all images from storage
        $event->images()->each(function ($img) {
            Storage::disk('public')->delete($img->image_path);
            $img->delete();
        });

        $event->delete();

        return redirect()->back()->with('success', 'Event deleted successfully.');
    }

    // PUBLIC: Welcome page (list all events)
    public function welcome()
    {
        $events = Event::select(
            'id',
            'title',
            'description',
            'coordinator_name',
            'event_type',
            'event_date',
            'registration_end_date',
            'has_registration_end_date',
            'required_players',
            'is_done',
            'allow_bracketing'
        )
            ->with('images')
            ->orderBy('event_date')
            ->get();

        $events->transform(function ($event) {
            $event->images_path = $event->images->pluck('image_path');
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
}
