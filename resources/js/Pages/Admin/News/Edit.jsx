import { Head, Link, useForm } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

export default function EditNews({ news, categories }) {
    const { data, setData, put, processing, errors } = useForm({
        title: news.title || '',
        description: news.description || '',
        image: null,
        category: news.category || '',
        newCategory: '',
        showNewCategoryInput: false,
        status: news.status || 'pending',
    });

    const [preview, setPreview] = useState(null);
    const [editorInstance, setEditorInstance] = useState(null);
    const quillRef = useRef(null);

    useEffect(() => {
        if (news.image) {
            setPreview(`/storage/${news.image}`);
        }
    }, [news.image]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        setData('image', file);

        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result);
            };
            reader.readAsDataURL(file);
        } else {
            setPreview(news.image ? `/storage/${news.image}` : null);
        }
    };

    const imageHandler = () => {
        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', 'image/*');
        input.click();

        input.onchange = async () => {
            const file = input.files[0];
            if (file) {
                // Create FormData for upload
                const formData = new FormData();
                formData.append('image', file);
                formData.append('_token', document.querySelector('meta[name="csrf-token"]')?.getAttribute('content'));

                try {
                    // Upload image to server
                    const response = await fetch('/admin/news/upload-image', {
                        method: 'POST',
                        body: formData,
                    });

                    if (response.ok) {
                        const result = await response.json();
                        const imageUrl = result.url;

                        // Insert image into editor
                        if (editorInstance) {
                            const range = editorInstance.getSelection();
                            editorInstance.insertEmbed(range.index, 'image', imageUrl);
                        }
                    } else {
                        console.error('Image upload failed');
                        alert('Failed to upload image. Please try again.');
                    }
                } catch (error) {
                    console.error('Error uploading image:', error);
                    alert('Error uploading image. Please try again.');
                }
            }
        };
    };

    const modules = {
        toolbar: {
            container: [
                [{ 'header': [1, 2, 3, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                ['link', 'image'],
                [{ 'color': [] }, { 'background': [] }],
                ['clean']
            ],
            handlers: {
                image: imageHandler
            }
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Prepare form data with the appropriate category
        const formData = new FormData();
        formData.append('_method', 'PUT');
        formData.append('title', data.title);
        formData.append('description', data.description);
        if (data.image) {
            formData.append('image', data.image);
        }
        formData.append('status', data.status);
        
        // If showing new category input, use newCategory, otherwise use the selected category
        if (data.showNewCategoryInput && data.newCategory) {
            formData.append('newCategory', data.newCategory);
        } else {
            formData.append('category', data.category);
        }
        
        put(route('admin.news.update', news.id), formData, {
            forceFormData: true,
            onError: (errors) => {
                // Handle errors if needed
            },
        });
    };

    // Image manipulation functionality
    useEffect(() => {
        const setupImageManipulation = () => {
            if (!quillRef.current) return;

            // Use a timeout to avoid the findDOMNode warning during initial render
            const timeoutId = setTimeout(() => {
                try {
                    const editor = quillRef.current.getEditor();
                    const editorContainer = editor.container;

                    let selectedImage = null;
                    let isResizing = false;
                    let isDragging = false;
                    let startX = 0;
                    let startY = 0;
                    let startWidth = 0;
                    let startHeight = 0;
                    let aspectRatio = 0;

                    // Add event listeners for image manipulation
                    const handleImageClick = (e) => {
                        const img = e.target;
                        if (img.tagName === 'IMG') {
                            e.preventDefault();
                            e.stopPropagation();

                            // Remove selected class from all images
                            const allImages = editorContainer.querySelectorAll('img');
                            allImages.forEach(image => {
                                image.classList.remove('selected');
                            });

                            // Add selected class to clicked image
                            img.classList.add('selected');
                            selectedImage = img;
                        }
                    };

                    const handleEditorClick = (e) => {
                        // Remove selected class from all images when clicking elsewhere
                        const allImages = editorContainer.querySelectorAll('img');
                        allImages.forEach(image => image.classList.remove('selected'));
                        selectedImage = null;
                    };

                    const handleMouseDown = (e) => {
                        if (!selectedImage) return;

                        const rect = selectedImage.getBoundingClientRect();
                        const handleSize = 20; // Larger clickable area

                        // Check if clicking on resize handle (corners) - larger tolerance area
                        const isTopLeft = e.clientX >= rect.left - 10 && e.clientX <= rect.left + handleSize - 10 &&
                                         e.clientY >= rect.top - 10 && e.clientY <= rect.top + handleSize - 10;
                        const isBottomRight = e.clientX >= rect.right - handleSize - 10 && e.clientX <= rect.right + 10 &&
                                             e.clientY >= rect.bottom - handleSize - 10 && e.clientY <= rect.bottom + 10;

                        if (isTopLeft || isBottomRight) {
                            e.preventDefault();
                            e.stopPropagation();
                            isResizing = true;
                            startX = e.clientX;
                            startY = e.clientY;
                            startWidth = selectedImage.offsetWidth;
                            startHeight = selectedImage.offsetHeight;
                            aspectRatio = startWidth / startHeight;

                            selectedImage.classList.add('resizing');

                            // Prevent text selection during resize
                            e.preventDefault();

                            const handleMouseMove = (e) => {
                                if (isResizing && selectedImage) {
                                    const deltaX = e.clientX - startX;
                                    const deltaY = e.clientY - startY;

                                    let newWidth = startWidth + deltaX;
                                    let newHeight = startHeight + deltaY;

                                    // Maintain aspect ratio if Shift is held (more intuitive)
                                    if (e.shiftKey || e.ctrlKey) {
                                        if (Math.abs(deltaX) > Math.abs(deltaY)) {
                                            newHeight = newWidth / aspectRatio;
                                        } else {
                                            newWidth = newHeight * aspectRatio;
                                        }
                                    }

                                    // Minimum size constraints (larger minimum)
                                    newWidth = Math.max(80, newWidth);
                                    newHeight = Math.max(80, newHeight);

                                    // Maximum size constraints (prevent huge images)
                                    newWidth = Math.min(800, newWidth);
                                    newHeight = Math.min(600, newHeight);

                                    selectedImage.style.width = newWidth + 'px';
                                    selectedImage.style.height = newHeight + 'px';
                                }
                            };

                            const handleMouseUp = () => {
                                if (isResizing && selectedImage) {
                                    selectedImage.classList.remove('resizing');
                                }
                                isResizing = false;
                                document.removeEventListener('mousemove', handleMouseMove);
                                document.removeEventListener('mouseup', handleMouseUp);
                            };

                            document.addEventListener('mousemove', handleMouseMove);
                            document.addEventListener('mouseup', handleMouseUp);
                        } else if (e.target === selectedImage) {
                            // Start dragging - make it easier to grab the image
                            e.preventDefault();
                            isDragging = true;
                            startX = e.clientX;
                            startY = e.clientY;

                            selectedImage.classList.add('dragging');

                            const handleMouseMove = (e) => {
                                if (isDragging && selectedImage) {
                                    const deltaX = e.clientX - startX;
                                    const deltaY = e.clientY - startY;

                                    // Only move if dragged a significant distance
                                    if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
                                        selectedImage.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
                                    }
                                }
                            };

                            const handleMouseUp = () => {
                                if (isDragging && selectedImage) {
                                    selectedImage.classList.remove('dragging');
                                    // Reset transform after dragging
                                    selectedImage.style.transform = '';
                                }
                                isDragging = false;
                                document.removeEventListener('mousemove', handleMouseMove);
                                document.removeEventListener('mouseup', handleMouseUp);
                            };

                            document.addEventListener('mousemove', handleMouseMove);
                            document.addEventListener('mouseup', handleMouseUp);
                        }
                    };

                    // Add event listeners
                    const eventListeners = [
                        { target: editorContainer, type: 'click', handler: handleImageClick },
                        { target: editor.root, type: 'click', handler: handleEditorClick },
                        { target: document, type: 'mousedown', handler: handleMouseDown },
                    ];

                    // Add event listeners
                    eventListeners.forEach(({ target, type, handler }) => {
                        target.addEventListener(type, handler);
                    });

                    // Cleanup function
                    return () => {
                        eventListeners.forEach(({ target, type, handler }) => {
                            target.removeEventListener(type, handler);
                        });
                    };
                } catch (error) {
                    console.warn('Editor not ready for image manipulation setup:', error);
                }
            }, 100);

            return () => clearTimeout(timeoutId);
        };

        const cleanup = setupImageManipulation();

        return cleanup;
    }, []);

    // Fix ReactQuill findDOMNode warning by using a custom wrapper
    const QuillWrapper = ({ forwardedRef, ...props }) => {
        const { enabled = true } = props;
        if (enabled) {
            return <ReactQuill ref={forwardedRef} {...props} />;
        }
        return <div ref={forwardedRef} className="hidden" />;
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">Edit News</h2>
                    <Link
                        href={route('admin.news.index')}
                        className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                    >
                        Back to News
                    </Link>
                </div>
            }
        >
            <Head title="Edit News" />
            <style>{`
                .image-resize-editor .ql-editor img {
                    max-width: 100%;
                    height: auto;
                    cursor: pointer;
                    border: 2px solid transparent;
                    border-radius: 4px;
                    transition: all 0.2s ease;
                    position: relative;
                    display: inline-block;
                    user-select: none;
                }

                .image-resize-editor .ql-editor img:hover {
                    border: 2px solid #3b82f6;
                    box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.5);
                }

                .image-resize-editor .ql-editor img.selected {
                    border: 2px solid #3b82f6;
                    box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.5);
                }

                /* Larger, more visible resize handles */
                .image-resize-editor .ql-editor img.selected::after {
                    content: '';
                    position: absolute;
                    bottom: -8px;
                    right: -8px;
                    width: 16px;
                    height: 16px;
                    background: #3b82f6;
                    border: 3px solid white;
                    border-radius: 50%;
                    cursor: nw-resize;
                    opacity: 1;
                    transition: all 0.2s ease;
                    z-index: 10;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                }

                .image-resize-editor .ql-editor img.selected::before {
                    content: '';
                    position: absolute;
                    top: -8px;
                    left: -8px;
                    width: 16px;
                    height: 16px;
                    background: #3b82f6;
                    border: 3px solid white;
                    border-radius: 50%;
                    cursor: nw-resize;
                    opacity: 1;
                    transition: all 0.2s ease;
                    z-index: 10;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                }

                /* Larger clickable areas for resize handles */
                .image-resize-editor .ql-editor img.selected {
                    padding: 8px;
                    margin: -8px;
                }

                /* Better visual feedback */
                .image-resize-editor .ql-editor img.selected:hover::after,
                .image-resize-editor .ql-editor img.selected:hover::before {
                    background: #1d4ed8;
                    transform: scale(1.1);
                }

                /* Corner resize handles */
                .image-resize-editor .ql-editor img.selected {
                    position: relative;
                }

                .image-resize-editor .ql-editor img.selected {
                    outline: 1px dashed #3b82f6;
                    outline-offset: 2px;
                }

                /* Image manipulation states */
                .image-resize-editor .ql-editor img.resizing {
                    transition: none;
                    z-index: 1000;
                }

                .image-resize-editor .ql-editor img.dragging {
                    opacity: 0.8;
                    transform: rotate(2deg);
                    z-index: 1000;
                    cursor: move;
                }

                /* Image toolbar for actions */
                .image-resize-editor .image-toolbar {
                    position: absolute;
                    background: white;
                    border: 1px solid #e5e7eb;
                    border-radius: 6px;
                    padding: 8px;
                    display: none;
                    z-index: 1000;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                }

                .image-resize-editor .image-toolbar.show {
                    display: block;
                }

                .image-resize-editor .image-toolbar button {
                    background: none;
                    border: none;
                    padding: 4px 8px;
                    margin: 0 2px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                    color: #374151;
                    transition: background-color 0.2s ease;
                }

                .image-resize-editor .image-toolbar button:hover {
                    background-color: #f3f4f6;
                }
            `}</style>

            <div className="py-12">
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-slate-900 overflow-hidden shadow-sm sm:rounded-lg border border-slate-700">
                        <div className="p-6">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Title */}
                                <div>
                                    <label htmlFor="title" className="block text-sm font-medium text-slate-300 mb-2">
                                        Title
                                    </label>
                                    <input
                                        type="text"
                                        id="title"
                                        value={data.title}
                                        onChange={(e) => setData('title', e.target.value)}
                                        className="mt-1 block w-full bg-slate-800 border border-slate-600 text-slate-100 rounded-md shadow-sm focus:ring-blue-600/50 focus:border-blue-600/50 px-3 py-2"
                                        required
                                    />
                                    {errors.title && <div className="text-red-400 text-sm mt-1">{errors.title}</div>}
                                </div>

                                {/* Category */}
                                <div>
                                    <label htmlFor="category" className="block text-sm font-medium text-slate-300 mb-2">
                                        Category
                                    </label>
                                    
                                    <select
                                        value={data.showNewCategoryInput ? 'new' : data.category}
                                        onChange={(e) => {
                                            if (e.target.value === 'new') {
                                                setData({
                                                    ...data,
                                                    showNewCategoryInput: true,
                                                    category: '',
                                                    newCategory: ''
                                                });
                                            } else {
                                                setData({
                                                    ...data,
                                                    showNewCategoryInput: false,
                                                    category: e.target.value
                                                });
                                            }
                                        }}
                                        className="w-full px-3 py-2 mb-2 bg-slate-800 border border-slate-700 rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Select a category</option>
                                        {categories && categories.map((category, index) => (
                                            <option key={index} value={category}>
                                                {category}
                                            </option>
                                        ))}
                                        <option value="new">+New Category</option>
                                    </select>

                                    {data.showNewCategoryInput && (
                                        <input
                                            type="text"
                                            value={data.newCategory}
                                            onChange={e => setData('newCategory', e.target.value)}
                                            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Enter new category name"
                                            autoFocus
                                        />
                                    )}
                                    {errors.category && <p className="mt-1 text-sm text-red-500">{errors.category}</p>}
                                </div>

                                {/* Status */}
                                <div>
                                    <label htmlFor="status" className="block text-sm font-medium text-slate-300 mb-2">
                                        Status
                                    </label>
                                    <select
                                        id="status"
                                        value={data.status}
                                        onChange={(e) => setData('status', e.target.value)}
                                        className="mt-1 block w-full bg-slate-800 border border-slate-600 text-slate-100 rounded-md shadow-sm focus:ring-blue-600/50 focus:border-blue-600/50 px-3 py-2"
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                    {errors.status && <div className="text-red-400 text-sm mt-1">{errors.status}</div>}
                                </div>

                                {/* Image */}
                                <div>
                                    <label htmlFor="image" className="block text-sm font-medium text-slate-300 mb-2">
                                        Image (optional)
                                    </label>
                                    <input
                                        type="file"
                                        id="image"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="mt-1 block w-full bg-slate-800 border border-slate-600 text-slate-100 rounded-md shadow-sm focus:ring-blue-600/50 focus:border-blue-600/50 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                                    />
                                    {errors.image && <div className="text-red-400 text-sm mt-1">{errors.image}</div>}

                                    {/* Image Preview */}
                                    {preview && (
                                        <div className="mt-4">
                                            <img
                                                src={preview}
                                                alt="Preview"
                                                className="max-w-xs max-h-48 object-cover rounded-lg border border-slate-600"
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Description with Rich Text Editor */}
                                <div>
                                    <label htmlFor="description" className="block text-sm font-medium text-slate-300 mb-2">
                                        Description
                                    </label>
                                    <QuillWrapper
                                        ref={quillRef}
                                        forwardedRef={quillRef}
                                        theme="snow"
                                        value={data.description}
                                        onChange={(value) => setData('description', value)}
                                        modules={{
                                            toolbar: [
                                                [{ 'header': [1, 2, 3, false] }],
                                                ['bold', 'italic', 'underline', 'strike'],
                                                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                                                ['link', 'image'],
                                                [{ 'color': [] }, { 'background': [] }],
                                                ['clean']
                                            ],
                                        }}
                                        formats={[
                                            'header', 'bold', 'italic', 'underline', 'strike',
                                            'list', 'bullet', 'link', 'image', 'color', 'background'
                                        ]}
                                        className="bg-slate-800 border border-slate-600 text-slate-100 image-resize-editor"
                                        style={{ minHeight: '200px' }}
                                        placeholder="Write your news article here..."
                                    />
                                    {errors.description && <div className="text-red-400 text-sm mt-1">{errors.description}</div>}
                                </div>

                                {/* Submit Button */}
                                <div className="flex justify-end space-x-3 pt-4">
                                    <Link
                                        href={route('admin.news.index')}
                                        className="bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold py-2 px-4 rounded border border-slate-600"
                                    >
                                        Cancel
                                    </Link>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {processing ? 'Updating...' : 'Update News'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
