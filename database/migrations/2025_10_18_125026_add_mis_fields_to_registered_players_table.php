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
        Schema::table('registered_players', function (Blueprint $table) {
            $table->string('course')->nullable()->after('department');
            $table->string('year_level')->nullable()->after('course');
            $table->string('contact_number')->nullable()->after('email');
            $table->decimal('gpa', 3, 2)->nullable()->after('year_level');
            $table->integer('enrolled_units')->nullable()->after('gpa');
            $table->string('scholarship_status')->nullable()->after('enrolled_units');
            $table->string('sport_team')->nullable()->after('team_name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('registered_players', function (Blueprint $table) {
            $table->dropColumn([
                'course',
                'year_level',
                'contact_number',
                'gpa',
                'enrolled_units',
                'scholarship_status',
                'sport_team'
            ]);
        });
    }
};
