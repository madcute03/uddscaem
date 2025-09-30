<?php

namespace App\Policies;

use App\Models\News;
use App\Models\User;

class NewsPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return true; // Anyone can view news index for admin
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, News $news): bool
    {
        return true; // Anyone can view individual news for admin
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->isAdmin() || $user->role === User::ROLE_WRITER;
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, News $news): bool
    {
        return $user->isAdmin() || ($user->role === User::ROLE_WRITER && $user->id === $news->writer_id);
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, News $news): bool
    {
        return $user->isAdmin() || ($user->role === User::ROLE_WRITER && $user->id === $news->writer_id);
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, News $news): bool
    {
        return $user->isAdmin();
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, News $news): bool
    {
        return $user->isAdmin();
    }
}
