<?php

namespace App\Policies;

use App\Models\Article;
use App\Models\User;

class ArticlePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isAdmin() || $user->isWriter();
    }

    public function view(User $user, Article $article): bool
    {
        if ($article->status === 'published') {
            return true;
        }

        return $user->isAdmin() || ($user->isWriter() && $article->author_id === $user->id);
    }

    public function create(User $user): bool
    {
        return $user->isAdmin() || $user->isWriter();
    }

    public function update(User $user, Article $article): bool
    {
        return $user->isAdmin() || ($user->isWriter() && $article->author_id === $user->id);
    }

    public function delete(User $user, Article $article): bool
    {
        return $user->isAdmin() || ($user->isWriter() && $article->author_id === $user->id);
    }

    public function restore(User $user, Article $article): bool
    {
        return $user->isAdmin();
    }

    public function forceDelete(User $user, Article $article): bool
    {
        return $user->isAdmin();
    }
}
