<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('articles', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('slug')->unique();
            $table->string('excerpt', 500)->nullable();
            $table->longText('body');
            $table->string('hero_image_path')->nullable();
            $table->enum('status', ['draft', 'scheduled', 'published'])->default('draft');
            $table->timestamp('published_at')->nullable();
            $table->foreignId('category_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('author_id')->nullable()->constrained('users')->nullOnDelete();
            $table->boolean('is_featured')->default(false);
            $table->boolean('is_headline')->default(false);
            $table->boolean('is_popular')->default(false);
            $table->unsignedInteger('views')->default(0);
            $table->unsignedTinyInteger('reading_time')->default(1);
            $table->softDeletes();
            $table->timestamps();

            $table->index(['status', 'published_at']);
            $table->index(['category_id', 'published_at']);
            $table->index(['is_featured', 'is_headline', 'is_popular']);
            $table->index('title');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('articles');
    }
};
