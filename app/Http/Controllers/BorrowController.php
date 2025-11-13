<?php

namespace App\Http\Controllers;

use App\Models\BorrowRequest;
use App\Models\Item;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BorrowController extends Controller
{
    public function index()
    {
        $items = Item::query()
            ->orderBy('name')
            ->get()
            ->map(fn ($i) => [
                'id' => $i->id,
                'name' => $i->name,
                'available' => $i->availableCount(),
            ]);

        return Inertia::render('Borrow/Index', [
            'items' => $items,
        ]);
    }

    public function create()
    {
        $items = Item::orderBy('name')->get(['id', 'name', 'quantity'])
            ->map(function ($i) {
                return [
                    'id' => $i->id,
                    'name' => $i->name,
                    'quantity' => $i->quantity,
                    'available' => $i->availableCount(),
                ];
            });
        return Inertia::render('Borrow/RequestForm', [
            'items' => $items,
        ]);
    }

    public function store(Request $request)
    {
        $studentId = $request->input('student_id');
        $email = $request->input('email');
        $itemId = $request->input('item_id');

        // Check if student already has a pending request for the same item
        $existingRequest = BorrowRequest::where('student_id', $studentId)
            ->where('item_id', $itemId)
            ->where('status', 'pending')
            ->first();

        if ($existingRequest) {
            return redirect()->back()->withErrors([
                'student_id' => 'You already have a pending request for this item.'
            ])->withInput();
        }

        // Check if email already has a pending request for the same item
        $existingEmailRequest = BorrowRequest::where('email', $email)
            ->where('item_id', $itemId)
            ->where('status', 'pending')
            ->first();

        if ($existingEmailRequest) {
            return redirect()->back()->withErrors([
                'email' => 'This email already has a pending request for this item.'
            ])->withInput();
        }

        $validated = $request->validate([
            'student_name' => ['required', 'string', 'max:255'],
            'student_id' => ['required', 'string', 'max:64'],
            'email' => ['required', 'email', 'max:255'],
            'item_id' => ['required', 'exists:items,id'],
            'purpose' => ['required', 'string', 'max:5000'],
            'quantity' => ['required', 'integer', 'min:1'],
            'contact_number' => ['nullable', 'string', 'max:20'],
        ]);

        // Check if requested quantity exceeds available quantity
        $item = Item::find($validated['item_id']);
        $availableQuantity = $item->availableCount();
        
        if ($validated['quantity'] > $availableQuantity) {
            return redirect()->back()->withErrors([
                'quantity' => "Requested quantity ({$validated['quantity']}) exceeds available quantity ({$availableQuantity})."
            ])->withInput();
        }

        $requestModel = BorrowRequest::create([
            ...$validated,
            'status' => 'pending',
            'requested_at' => now(),
        ]);

        return redirect()->route('borrow.index')->with('success', 'Your request has been submitted. Please check your email for pick-up instructions.');
    }

    public function search(Request $request)
    {
        $studentId = $request->query('student_id');
        $email = $request->query('email');

        if (!$studentId && !$email) {
            return redirect()->route('borrow.index')->with('error', 'Please provide either Student ID or Email address.');
        }

        // Build query to find requests by student_id or email
        $query = BorrowRequest::query()->with('item');

        if ($studentId) {
            $query->where('student_id', $studentId);
        }

        if ($email) {
            $query->where('email', $email);
        }

        $userRequests = $query->orderBy('created_at', 'desc')->get()->map(function ($request) {
            return [
                'id' => $request->id,
                'student_name' => $request->student_name,
                'student_id' => $request->student_id,
                'email' => $request->email,
                'status' => $request->status,
                'requested_at' => $request->requested_at,
                'approved_at' => $request->approved_at,
                'denied_at' => $request->denied_at,
                'returned_at' => $request->returned_at,
                'item' => $request->item ? [
                    'id' => $request->item->id,
                    'name' => $request->item->name,
                ] : null,
            ];
        });

        // Get items for the main page
        $items = Item::query()
            ->orderBy('name')
            ->get()
            ->map(fn ($i) => [
                'id' => $i->id,
                'name' => $i->name,
                'available' => $i->availableCount(),
            ]);

        return Inertia::render('Borrow/Index', [
            'items' => $items,
            'userRequests' => $userRequests,
        ]);
    }

}
