<?php

use App\Http\Controllers\ArticleController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\WriterController;
use Illuminate\Support\Facades\Route;

Route::get('/', [ArticleController::class, 'home'])->name('home');
Route::get('/articles', [ArticleController::class, 'publicIndex'])->name('articles.index');
Route::get('/articles/{article:slug}', [ArticleController::class, 'show'])->name('articles.show');

Route::middleware(['auth:sanctum'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/dashboard', [ArticleController::class, 'adminIndex'])->name('dashboard');

    Route::post('/articles', [ArticleController::class, 'store'])->name('articles.store');
    Route::put('/articles/{article}', [ArticleController::class, 'update'])->name('articles.update');
    Route::delete('/articles/{article}', [ArticleController::class, 'destroy'])->name('articles.destroy');
    Route::post('/articles/{article}/toggle-headline', [ArticleController::class, 'toggleHeadline'])->name('articles.toggle-headline');
    Route::post('/articles/{article}/toggle-featured', [ArticleController::class, 'toggleFeatured'])->name('articles.toggle-featured');
    Route::post('/articles/{article}/toggle-popular', [ArticleController::class, 'togglePopular'])->name('articles.toggle-popular');
    Route::post('/articles/upload', [ArticleController::class, 'uploadRichMedia'])->name('articles.upload');

    Route::get('/categories', [CategoryController::class, 'index'])->name('categories.index');
    Route::post('/categories', [CategoryController::class, 'store'])->name('categories.store');
    Route::put('/categories/{category}', [CategoryController::class, 'update'])->name('categories.update');
    Route::delete('/categories/{category}', [CategoryController::class, 'destroy'])->name('categories.destroy');

    Route::get('/writers', [WriterController::class, 'index'])->name('writers.index');
    Route::post('/writers', [WriterController::class, 'store'])->name('writers.store');
    Route::put('/writers/{writer}', [WriterController::class, 'update'])->name('writers.update');
    Route::delete('/writers/{writer}', [WriterController::class, 'destroy'])->name('writers.destroy');
});
