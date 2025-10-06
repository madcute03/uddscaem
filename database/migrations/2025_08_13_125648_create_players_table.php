<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('players', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_registration_id')
                ->constrained('event_registrations')
                ->onDelete('cascade');
            $table->string('student_id');
            $table->string('name');
            $table->string('email'); // ✅ Add this line
            $table->string('department');
            $table->integer('age');
            $table->longText('player_image');
            $table->longText('whiteform_image');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('players');
    }
};
