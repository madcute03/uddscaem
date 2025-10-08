<?php

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isAdmin();
    }

    public function view(User $user, User $model): bool
    {
        return $user->isAdmin() || $user->id === $model->id;
    }

    public function createWriter(User $user): bool
    {
        return $user->isAdmin() || $user->isWriter();
    }

    public function updateWriter(User $user, User $model): bool
    {
        return $user->isAdmin() || $user->id === $model->id;
    }

    public function deleteWriter(User $user, User $model): bool
    {
        return $user->isAdmin() && $user->id !== $model->id;
    }
    
    public function update(User $user, User $model): bool
    {
        // Allow admins to update any user, or users to update their own profile
        return $user->isAdmin() || $user->id === $model->id;
    }
    
    public function toggleStatus(User $user, User $model): bool
    {
        // Only admins can toggle user status
        return $user->isAdmin();
    }
}
