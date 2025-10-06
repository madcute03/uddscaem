<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('news', function (Blueprint $table) {
            $table->id();
            $table->foreignId('writer_id')->constrained('users')->onDelete('cascade');
            $table->string('writer_name');
            $table->string('title');
            $table->string('slug')->unique();
            $table->string('image');
            $table->string('category');
            $table->longText('description')->nullable();
            $table->string('date');
            $table->enum('status', ['pending', 'active', 'inactive'])->default('pending');
            $table->integer('count')->default(0);
            $table->timestamps();

            $table->index(['title', 'category']);
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('news');
    }
};
