<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class WriterController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', User::class);

        $filters = $request->only(['search']);

        $writers = User::query()
            ->writers()
            ->when($filters['search'] ?? null, function ($query, $search) {
                $query->where(function ($query) use ($search) {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->latest('created_at')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Admin/Writers', [
            'writers' => $writers,
            'filters' => $filters,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('createWriter', User::class);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'bio' => ['nullable', 'string'],
        ]);

        $writer = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => User::ROLE_WRITER,
            'bio' => $validated['bio'] ?? null,
        ]);

        event(new Registered($writer));

        return redirect()->back()->with('success', 'Writer created successfully.');
    }

    public function update(Request $request, User $writer): RedirectResponse
    {
        $this->authorize('updateWriter', $writer);

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'string', 'email', 'max:255', Rule::unique('users')->ignore($writer->id)],
            'password' => ['nullable', 'string', 'min:8', 'confirmed'],
            'bio' => ['nullable', 'string'],
        ]);

        if (!empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $writer->update($validated);

        return redirect()->back()->with('success', 'Writer updated successfully.');
    }

    public function destroy(User $writer): RedirectResponse
    {
        $this->authorize('deleteWriter', $writer);

        $writer->articles()->update(['author_id' => null]);
        $writer->delete();

        return redirect()->back()->with('success', 'Writer deleted successfully.');
    }
}
