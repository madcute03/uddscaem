<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Writer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;

class WriterController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $writers = User::where('role', 'writer')
            ->with('writerProfile')
            ->withCount('news')
            ->get();

        return inertia('Admin/Writers/Index', [
            'writers' => $writers,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return inertia('Admin/Writers/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', 'unique:'.User::class],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'bio' => ['nullable', 'string', 'max:1000'],
            'specialization' => ['nullable', 'string', 'max:255'],
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => 'writer',
        ]);

        Writer::create([
            'user_id' => $user->id,
            'bio' => $request->bio,
            'specialization' => $request->specialization,
        ]);

        return redirect()->route('admin.writers.index')->with('success', 'Writer created successfully!');
    }

    /**
     * Display the specified resource.
     */
    public function show(User $writer)
    {
        $this->authorize('view', $writer);

        $writer->load('writerProfile', 'news');

        return inertia('Admin/Writers/Show', [
            'writer' => $writer,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(User $writer)
    {
        $this->authorize('update', $writer);

        $writer->load('writerProfile');

        return inertia('Admin/Writers/Edit', [
            'writer' => $writer,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, User $writer)
    {
        $this->authorize('update', $writer);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', 'unique:users,email,'.$writer->id],
            'bio' => ['nullable', 'string', 'max:1000'],
            'specialization' => ['nullable', 'string', 'max:255'],
            'password' => ['nullable', 'confirmed', 'min:8'],
            'status' => ['sometimes', 'required', 'in:active,inactive'],
        ]);

        // Update user data
        $userData = [
            'name' => $validated['name'],
            'email' => $validated['email'],
        ];

        // Only update password if it's provided
        if (!empty($validated['password'])) {
            $userData['password'] = bcrypt($validated['password']);
        }

        $writer->update($userData);

        // Update or create writer profile
        $writerProfileData = [
            'bio' => $validated['bio'] ?? null,
            'specialization' => $validated['specialization'] ?? null,
        ];

        // Only update status if it's provided (for admin)
        if (isset($validated['status'])) {
            $writerProfileData['status'] = $validated['status'];
        }

        if ($writer->writerProfile) {
            $writer->writerProfile()->update($writerProfileData);
        } else {
            $writer->writerProfile()->create($writerProfileData);
        }

        return redirect()->route('admin.writers.index')->with('success', 'Writer updated successfully!');
    }

    /**
     * Remove the specified resource from storage.
     */
    /**
     * Remove the specified resource from storage.
     */
    public function destroy(User $writer)
    {
        $this->authorize('deleteWriter', $writer);

        // Delete writer profile
        $writer->writerProfile()->delete();

        // Delete writer (this will cascade delete their news due to foreign key constraint)
        $writer->delete();

        return redirect()->route('admin.writers.index')->with('success', 'Writer deleted successfully!');
    }

    /**
     * Toggle writer status.
     *
     * @param  \App\Models\User  $writer
     * @return \Illuminate\Http\RedirectResponse
     */
    public function toggleStatus(User $writer)
    {
        $this->authorize('update', $writer);
        
        // Check if writer profile exists, if not create one
        if (!$writer->writerProfile) {
            $writer->writerProfile()->create([
                'status' => 'active', // Default status
                'bio' => '',
                'specialization' => '',
            ]);
            
            return redirect()->back()->with('success', 'Writer profile created and set to active!');
        }
        
        // Toggle the status
        $newStatus = $writer->writerProfile->status === 'active' ? 'inactive' : 'active';
        
        $writer->writerProfile()->update([
            'status' => $newStatus,
        ]);
        
        return redirect()->back()->with('success', 'Writer status updated successfully!');
    }
}
