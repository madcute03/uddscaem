<?php

namespace App\Http\Controllers;

use App\Models\Requirement;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;

class RequirementsController extends Controller
{
    // Public page to view and download requirements
    public function index()
    {
        $requirements = Requirement::with('uploader')->latest()->get();
        
        return Inertia::render('Requirements/Index', [
            'requirements' => $requirements
        ]);
    }

    // Admin page to manage requirements
    public function adminIndex()
    {
        $requirements = Requirement::with('uploader')->latest()->get();
        
        return Inertia::render('Requirements/AdminRequirements', [
            'requirements' => $requirements
        ]);
    }

    // Upload a new requirement (admin only)
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'file' => 'required|file|mimes:pdf,doc,docx,jpg,jpeg,png|max:10240',
        ]);

        // Handle file upload
        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $filename = time() . '_' . $file->getClientOriginalName();
            $path = $file->storeAs('requirements', $filename, 'public');
            
            Requirement::create([
                'title' => $validated['title'],
                'description' => $validated['description'],
                'file_path' => $path,
                'uploaded_by' => auth()->id(),
            ]);
        }

        return redirect()->back()->with('success', 'Requirement uploaded successfully!');
    }

    // View a requirement file inline (for viewing, not downloading)
    public function view(Requirement $requirement)
    {
        if (!$requirement->file_path || !Storage::disk('public')->exists($requirement->file_path)) {
            abort(404, 'File not found');
        }

        $filePath = Storage::disk('public')->path($requirement->file_path);
        $mimeType = Storage::disk('public')->mimeType($requirement->file_path);
        
        return response()->file($filePath, [
            'Content-Type' => $mimeType,
            'Content-Disposition' => 'inline; filename="' . basename($requirement->file_path) . '"'
        ]);
    }

    // Delete a requirement (admin only)
    public function destroy(Requirement $requirement)
    {
        // Delete file from storage
        if ($requirement->file_path) {
            Storage::disk('public')->delete($requirement->file_path);
        }
        
        $requirement->delete();
        
        return redirect()->back()->with('success', 'Requirement deleted successfully!');
    }
}
