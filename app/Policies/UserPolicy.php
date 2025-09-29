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
        return $user->isAdmin();
    }

    public function updateWriter(User $user, User $model): bool
    {
        return $user->isAdmin();
    }

    public function deleteWriter(User $user, User $model): bool
    {
        return $user->isAdmin() && $user->id !== $model->id;
    }
}
