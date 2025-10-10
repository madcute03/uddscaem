import { Head, Link, useForm } from '@inertiajs/react';
import { useState, useEffect, useRef, useCallback } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import 'quill-image-resize-module-react';
import ImageResize from 'quill-image-resize-module-react';

// Custom image resize module with better mobile support
const modules = {
  toolbar: [
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    ['link', 'image', 'video'],
    ['clean']
  ],
  clipboard: {
    matchVisual: false,
  },
  imageResize: {
    modules: ['Resize'],
    displaySize: false,
    handleStyles: {
      backgroundColor: '#3B82F6',
      border: '2px solid white',
      borderRadius: '50%',
      height: '24px',
      width: '24px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
      zIndex: '1000',
      touchAction: 'none'
    },
    displayStyles: {
      display: 'none'
    },
    toolbarStyles: {
      display: 'none'
    },
    touchAction: 'manipulation',
    handleOffset: 12
  }
};

// Register the image resize module and custom image format
const ImageFormat = ReactQuill.Quill.import('formats/image');

class CustomImage extends ImageFormat {
  static create(value) {
    const node = super.create(value);
    return node;
  }
}

// Register the custom image format
CustomImage.blotName = 'image';
CustomImage.className = 'ql-image';
CustomImage.tagName = 'IMG';

// Register the custom image format and modules
ReactQuill.Quill.register(CustomImage, true);
ReactQuill.Quill.register('modules/imageResize', ImageResize);

const styles = `
  .ql-editor img {
    max-width: 100%;
    height: auto;
    transition: all 0.2s ease;
    touch-action: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
  }

  .ql-editor img.active-resize {
    outline: 2px solid #3B82F6;
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2);
    touch-action: none;
  }

  .ql-image-resize-handle {
    width: 24px !important;
    height: 24px !important;
    border-radius: 50% !important;
    border: 2px solid white !important;
    background: #3B82F6 !important;
    box-shadow: 0 2px 6px rgba(0,0,0,0.3) !important;
    touch-action: none;
    z-index: 1000;
    cursor: pointer;
    display: block !important;
  }
`;

export default function CreateNews({ auth, existingCategories: propCategories = [] }) {
    // Ensure categories is always an array and has default values
    const defaultCategories = ['Sports', 'Culture', 'Arts'];
    const existingCategories = Array.isArray(propCategories) && propCategories.length > 0 
        ? propCategories 
        : defaultCategories;
    const { data, setData, post, processing, errors = {} } = useForm({
        title: '',
        description: '',
        image: null,
        category: '',
        newCategory: '',
        status: 'draft',
        showNewCategoryInput: false,
        errors: {}
    });
    
    const [preview, setPreview] = useState(null);
    const quillRef = useRef(null);
    
    const handleDescriptionChange = (value) => {
        setData('description', value);
    };
    
    // Add touch and mouse event handlers for better mobile support
    useEffect(() => {
        if (!quillRef.current) return;
        
        const editorContainer = quillRef.current.getEditor().container;
        
        const handleTouchStart = (e) => {
            const quill = quillRef.current.getEditor();
            window.quillInstance = quill;
            document.body.style.overflow = 'hidden';
        };
        
        const handleTouchEnd = () => {
            delete window.quillInstance;
            document.body.style.overflow = '';
        };
        
        const handleMouseDown = (e) => {
            if (e.button === 0) { // Left mouse button
                const quill = quillRef.current.getEditor();
                window.quillInstance = quill;
            }
        };
        
        const handleMouseUp = () => {
            delete window.quillInstance;
        };
        
        // Add event listeners
        editorContainer.addEventListener('touchstart', handleTouchStart, { passive: true });
        editorContainer.addEventListener('touchend', handleTouchEnd, { passive: true });
        editorContainer.addEventListener('touchcancel', handleTouchEnd, { passive: true });
        editorContainer.addEventListener('mousedown', handleMouseDown);
        editorContainer.addEventListener('mouseup', handleMouseUp);
        
        // Add styles
        const styleElement = document.createElement('style');
        styleElement.innerHTML = styles;
        document.head.appendChild(styleElement);
        
        return () => {
            editorContainer.removeEventListener('touchstart', handleTouchStart);
            editorContainer.removeEventListener('touchend', handleTouchEnd);
            editorContainer.removeEventListener('touchcancel', handleTouchEnd);
            editorContainer.removeEventListener('mousedown', handleMouseDown);
            editorContainer.removeEventListener('mouseup', handleMouseUp);
            document.head.removeChild(styleElement);
            delete window.quillInstance;
        };
    }, []);
    
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                const img = new Image();
                img.onload = () => {
                    setData('image', file);
                    setData('image_width', img.width);
                    setData('image_height', img.height);
                    setPreview(ev.target.result);
                };
                img.src = ev.target.result;
            };
            reader.readAsDataURL(file);
        } else {
            setData('image', null);
            setPreview(null);
        }
    };
    
    const handleRemoveImage = () => {
        setData('remove_image', true);
        setData('image', null);
        setPreview(null);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        const formData = new FormData();
        formData.append('title', data.title);
        formData.append('description', data.description || '');
        formData.append('category', data.category);
        formData.append('newCategory', data.newCategory || '');
        formData.append('status', data.status || 'draft');
        
        if (data.image) {
            formData.append('image', data.image);
            if (data.image_width) formData.append('image_width', data.image_width);
            if (data.image_height) formData.append('image_height', data.image_height);
        }
        
        if (data.remove_image) {
            formData.append('remove_image', '1');
        }
        
        post(route('admin.news.store'), {
            data: formData,
            forceFormData: true,
            onSuccess: () => {
                // Reset form on success
                setData({
                    title: '',
                    description: '',
                    image: null,
                    category: '',
                    newCategory: '',
                    status: 'draft',
                    errors: {}
                });
                setPreview(null);
            },
            onError: (errors) => {
                console.error('Error submitting form:', errors);
            }
        });
    };

    // Image manipulation functionality
    useEffect(() => {
        const setupImageManipulation = () => {
            if (!quillRef.current) return () => {};

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

                            const handleResizeMouseMove = (e) => {
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

                            const handleResizeMouseUp = () => {
                                if (isResizing && selectedImage) {
                                    selectedImage.classList.remove('resizing');
                                }
                                isResizing = false;
                                document.removeEventListener('mousemove', handleResizeMouseMove);
                                document.removeEventListener('mouseup', handleResizeMouseUp);
                            };

                            document.addEventListener('mousemove', handleResizeMouseMove);
                            document.addEventListener('mouseup', handleResizeMouseUp);
                        } else if (e.target === selectedImage) {
                            // Start dragging - make it easier to grab the image
                            e.preventDefault();
                            isDragging = true;
                            startX = e.clientX;
                            startY = e.clientY;

                            selectedImage.classList.add('dragging');

                            const handleDragMouseMove = (e) => {
                                if (isDragging && selectedImage) {
                                    const deltaX = e.clientX - startX;
                                    const deltaY = e.clientY - startY;

                                    // Only move if dragged a significant distance
                                    if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
                                        selectedImage.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
                                    }
                                }
                            };

                            const handleDragMouseUp = () => {
                                if (isDragging && selectedImage) {
                                    selectedImage.classList.remove('dragging');
                                    // Reset transform after dragging
                                    selectedImage.style.transform = '';
                                }
                                isDragging = false;
                                document.removeEventListener('mousemove', handleDragMouseMove);
                                document.removeEventListener('mouseup', handleDragMouseUp);
                            };

                            document.addEventListener('mousemove', handleDragMouseMove);
                            document.addEventListener('mouseup', handleDragMouseUp);
                        }
                    };

                    // Add event listeners
                    editorContainer.addEventListener('click', handleImageClick);
                    editor.root.addEventListener('click', handleEditorClick);
                    document.addEventListener('mousedown', handleMouseDown);

                    // Cleanup function
                    return () => {
                        editorContainer.removeEventListener('click', handleImageClick);
                        editor.root.removeEventListener('click', handleEditorClick);
                        document.removeEventListener('mousedown', handleMouseDown);
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

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">Create News</h2>
                    <Link
                        href={route('admin.news.index')}
                        className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                    >
                        Back to News
                    </Link>
                </div>
            }
            suppressHydrationWarning={true}
        >
            <Head title="Create News" />
            <style>{`
                .image-resize-editor .ql-editor img {
                    max-width: 100%;
                    height: auto;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .image-resize-editor .ql-editor img.selected {
                    outline: 2px solid #3b82f6;
                    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.3);
                }
                .image-resize-editor .ql-editor img.resizing {
                    opacity: 0.8;
                }
                .image-resize-editor .ql-editor img.dragging {
                    opacity: 0.8;
                    cursor: move;
                }
                .image-resize-handle {
                    position: absolute;
                    width: 10px;
                    height: 10px;
                    background-color: #3b82f6;
                    border: 2px solid white;
                    border-radius: 50%;
                    z-index: 1000;
                }
                .image-resize-handle.tl {
                    top: -5px;
                    left: -5px;
                    cursor: nwse-resize;
                }
                .image-resize-handle.tr {
                    top: -5px;
                    right: -5px;
                    cursor: nesw-resize;
                }
                .image-resize-handle.bl {
                    bottom: -5px;
                    left: -5px;
                    cursor: nesw-resize;
                }
                .image-resize-handle.br {
                    bottom: -5px;
                    right: -5px;
                    cursor: nwse-resize;
                }
                .image-toolbar {
                    position: absolute;
                    background: white;
                    border: 1px solid #e2e8f0;
                    border-radius: 4px;
                    padding: 4px;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
                    z-index: 1000;
                    display: flex;
                    gap: 4px;
                }
                .image-toolbar button {
                    background: white;
                    border: 1px solid #e2e8f0;
                    border-radius: 2px;
                    padding: 4px 8px;
                    cursor: pointer;
                    font-size: 12px;
                }
                .image-toolbar button:hover {
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
                                        Title <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="title"
                                        value={data.title}
                                        onChange={e => setData('title', e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter news title"
                                        required
                                    />
                                    {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
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
                                                    category: e.target.value,
                                                    errors: { ...errors, category: '' }
                                                });
                                            }
                                        }}
                                        className="w-full px-3 py-2 mb-2 bg-slate-800 border border-slate-700 rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Select a category</option>
                                        {existingCategories.map((category, index) => (
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
                                            className="w-full px-3 py-2 mt-2 bg-slate-800 border border-slate-700 rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Enter new category name"
                                            required={formData.showNewCategoryInput}
                                        />
                                    )}
                                    {errors.category && <p className="mt-1 text-sm text-red-500">{errors.category}</p>}
                                </div>

                                {/* Image Upload */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Featured Image
                                    </label>
                                    <div className="mt-1 flex items-center">
                                        <span className="inline-block h-24 w-24 rounded-lg overflow-hidden bg-slate-700 border border-slate-600">
                                            {preview ? (
                                                <img
                                                    src={preview}
                                                    alt="Preview"
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <svg
                                                    className="h-full w-full text-slate-400"
                                                    fill="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.67 0 8.997 1.701 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                                                </svg>
                                            )}
                                        </span>
                                        <label
                                            htmlFor="image-upload"
                                            className="ml-5 bg-slate-800 py-2 px-3 border border-slate-700 rounded-md shadow-sm text-sm leading-4 font-medium text-slate-300 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
                                        >
                                            Change
                                        </label>
                                        <input
                                            id="image-upload"
                                            name="image-upload"
                                            type="file"
                                            className="sr-only"
                                            onChange={handleImageChange}
                                            accept="image/*"
                                        />
                                    </div>
                                    {errors.image && <p className="mt-1 text-sm text-red-500">{errors.image}</p>}
                                </div>

                                {/* Description */}
                                <div>
                                    <label htmlFor="description" className="block text-sm font-medium text-slate-300 mb-2">
                                        Description
                                    </label>
                                    <div className="image-resize-editor">
                                        <ReactQuill
                                            ref={quillRef}
                                            theme="snow"
                                            value={data.description}
                                            onChange={handleDescriptionChange}
                                            className="bg-slate-800 text-slate-100 rounded-b-md"
                                            placeholder="Write news description here..."
                                            modules={modules}
                                            style={{ minHeight: '200px' }}
                                        />
                                    </div>
                                    {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description}</p>}
                                </div>

                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${processing ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        {processing ? 'Creating...' : 'Create News'}
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
