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
        Schema::create('athletes', function (Blueprint $table) {
            $table->id();
            $table->string('student_id')->unique();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('contact_number')->nullable();
            $table->string('department');
            $table->string('course')->nullable();
            $table->string('year_level')->nullable();
            $table->integer('age');
            $table->decimal('gpa', 3, 2)->nullable();
            $table->integer('enrolled_units')->nullable();
            $table->string('scholarship_status')->nullable();
            $table->string('sport_team')->nullable();
            $table->string('team_name')->nullable();
            $table->string('gdrive_link')->nullable();
            $table->string('status')->default('active'); // active, inactive, graduated
            $table->timestamp('registered_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('athletes');
    }
};
