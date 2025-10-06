<?php

namespace App\Http\Controllers;

use App\Models\Event;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RegisterController extends Controller
{
    /**
     * Show the event registration form.
     *
     * @param int $id
     * @return \Inertia\Response
     */
    public function create($id)
    {
        $event = Event::findOrFail($id);

        return Inertia::render('RegisterEvent', [
            'event' => $event,
        ]);
    }

    /**
     * Handle the registration submission.
     *
     * @param \Illuminate\Http\Request $request
     * @param int $id
     * @return \Illuminate\Http\RedirectResponse
     */
    public function store(Request $request, $id)
    {
        $event = Event::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email',
        ]);

        // Save registration (you should create a Registration model)
        $event->registrations()->create($validated);

        return redirect()->route('events.show', $id)->with('success', 'You have registered successfully!');
    }
}
