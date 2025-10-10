import { Head, Link, useForm } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
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

// Register the image resize module
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
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
  }

  .ql-editor img.selected {
    outline: 2px solid #3B82F6;
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2);
    position: relative;
  }

  .ql-editor img::after {
    content: '';
    position: absolute;
    width: 30px;
    height: 30px;
    right: -15px;
    bottom: -15px;
    background: #3B82F6;
    border: 2px solid white;
    border-radius: 50%;
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    display: none;
    touch-action: none;
    z-index: 1000;
  }

  .ql-editor img.selected::after {
    display: block;
  }

  /* Improve touch targets for mobile */
  @media (pointer: coarse) {
    .ql-editor img {
      min-width: 100px;
      min-height: 100px;
    }
    
    .ql-editor img::after {
      width: 36px;
      height: 36px;
      right: -18px;
      bottom: -18px;
    }
  }

  @media (max-width: 768px) {
    .ql-toolbar.ql-snow .ql-formats {
      margin-right: 8px;
    }
    .ql-toolbar.ql-snow .ql-formats button {
      width: 32px;
      height: 32px;
    }
  }`;

export default function EditNews({ auth, news, categories: propCategories = [] }) {
  // Ensure categories is always an array and has default values
  const defaultCategories = ['Sports', 'Culture', 'Arts'];
  const categories = Array.isArray(propCategories) && propCategories.length > 0 
    ? propCategories 
    : defaultCategories;
  const { data, setData, post, processing, errors, progress } = useForm({
    title: news.title || '',
    description: news.description || '',
    category: news.category || '',
    newCategory: '',
    status: news.status || 'pending',
    image: null,
    remove_image: false,
    _method: 'PUT',
    image_width: null,
  });

  const [preview, setPreview] = useState(news.image ? `/storage/${news.image}` : null);
  const quillRef = useRef(null);

  // Enhanced touch and mouse interaction support for image resizing with auto-save
  useEffect(() => {
    if (!quillRef.current) return () => {};

    const editor = quillRef.current.getEditor();
    const editorContainer = editor.container;

    // Store the quill instance globally for the delete button
    window.quillInstance = editor;

    let selectedImage = null;
    let isResizing = false;
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let startWidth = 0;
    let startHeight = 0;
    let aspectRatio = 0;

    // Touch event handlers
    const handleTouchStart = (e) => {
      const touch = e.touches[0];
      const img = touch.target.closest('img');
      
      if (!img) {
        // Clicked outside image, deselect
        const allImages = editorContainer.querySelectorAll('img');
        allImages.forEach(image => image.classList.remove('selected'));
        selectedImage = null;
        return;
      }
      
      e.preventDefault();
      e.stopPropagation();
      
      // Remove selected class from all images
      const allImages = editorContainer.querySelectorAll('img');
      allImages.forEach(image => image.classList.remove('selected'));
      
      // Add selected class to clicked image
      img.classList.add('selected');
      selectedImage = img;
      
      const rect = img.getBoundingClientRect();
      
      // Check if touch is on the resize handle (bottom-right corner)
      const handleSize = 50; // Larger touch target for mobile
      const isOnHandle = touch.clientX >= rect.right - handleSize && 
                        touch.clientY >= rect.bottom - handleSize;
      
      if (isOnHandle) {
        isResizing = true;
        startX = touch.clientX;
        startY = touch.clientY;
        startWidth = rect.width;
        startHeight = rect.height;
        aspectRatio = startWidth / startHeight;
        document.body.style.overflow = 'hidden';
      } else {
        // Start dragging
        isDragging = true;
        startX = touch.clientX - rect.left;
        startY = touch.clientY - rect.top;
        img.style.cursor = 'grabbing';
      }
    };

    const handleTouchMove = (e) => {
      if (!selectedImage) return;
      
      const touch = e.touches[0];
      
      if (isResizing) {
        e.preventDefault();
        const width = startWidth + (touch.clientX - startX);
        const height = width / aspectRatio;
        
        selectedImage.style.width = `${width}px`;
        selectedImage.style.height = `${height}px`;
      } else if (isDragging) {
        e.preventDefault();
        const editorRect = editorContainer.getBoundingClientRect();
        let left = touch.clientX - startX - editorRect.left;
        let top = touch.clientY - startY - editorRect.top;
        
        // Boundary checks
        left = Math.max(0, Math.min(left, editorRect.width - selectedImage.width));
        top = Math.max(0, Math.min(top, editorRect.height - selectedImage.height));
        
        selectedImage.style.position = 'absolute';
        selectedImage.style.left = `${left}px`;
        selectedImage.style.top = `${top}px`;
      }
    };

    const handleTouchEnd = () => {
      isResizing = false;
      isDragging = false;
      document.body.style.overflow = '';
      if (selectedImage) {
        selectedImage.style.cursor = 'grab';
        // Auto-save description when image manipulation ends
        const currentContent = editor.root.innerHTML;
        setData('description', currentContent);
      }
    };

    // Mouse event handlers
    const handleImageClick = (e) => {
      const img = e.target;
      if (img.tagName === 'IMG') {
        e.preventDefault();
        e.stopPropagation();

        // Remove selected class from all images
        const allImages = editorContainer.querySelectorAll('img');
        allImages.forEach(image => image.classList.remove('selected'));

        // Add selected class to clicked image
        img.classList.add('selected');
        selectedImage = img;
        
        // Add cursor style
        img.style.cursor = 'grab';
      }
    };

    const handleEditorClick = (e) => {
      // Remove selected class from all images when clicking elsewhere
      const allImages = editorContainer.querySelectorAll('img');
      allImages.forEach(image => image.classList.remove('selected'));
      selectedImage = null;
    };

    // Add event listeners
    editorContainer.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
    editorContainer.addEventListener('click', handleImageClick);
    editorContainer.addEventListener('mousedown', handleEditorClick);

    // Add styles to head
    const styleElement = document.createElement('style');
    styleElement.innerHTML = styles;
    document.head.appendChild(styleElement);

    return () => {
      // Remove all event listeners
      editorContainer.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      editorContainer.removeEventListener('click', handleImageClick);
      editorContainer.removeEventListener('mousedown', handleEditorClick);
      
      // Clean up
      document.body.style.overflow = '';
      document.head.removeChild(styleElement);
      
      // Clean up the global reference
      delete window.quillInstance;
    };
  }, []);

  const handleDescriptionChange = (value) => {
    setData('description', value);
  };

  const handleFileChange = (e) => {
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
    
    formData.append('_method', 'PUT');
    formData.append('title', data.title);
    formData.append('description', data.description);
    formData.append('category', data.category);
    formData.append('newCategory', data.newCategory);
    formData.append('status', data.status);

    if (data.image) {
      formData.append('image', data.image);
      if (data.image_width) formData.append('image_width', data.image_width);
      if (data.image_height) formData.append('image_height', data.image_height);
    }
    
    if (data.remove_image) {
      formData.append('remove_image', '1');
    }

    post(route('admin.news.update', news.id), {
      data: formData,
      forceFormData: true,
    });
  };

  return (
    <AuthenticatedLayout 
      user={auth.user} 
      header={<h2 className="font-semibold text-xl text-slate-100 leading-tight">Edit News</h2>}
    >
      <Head title="Edit News" />
      
      <div className="py-8">
        <div className="max-w-5xl mx-auto sm:px-6 lg:px-8">
          <div className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 shadow-2xl sm:rounded-lg p-6">
            <form onSubmit={handleSubmit} encType="multipart/form-data">
              {/* Title */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-300">Title</label>
                <input 
                  type="text" 
                  value={data.title} 
                  onChange={(e) => setData('title', e.target.value)} 
                  className="mt-1 block w-full rounded-md border-slate-600 bg-slate-700 text-slate-100 shadow-sm focus:border-blue-500 focus:ring-blue-500" 
                />
                {errors.title && <p className="text-red-500 text-sm">{errors.title}</p>}
              </div>

              {/* Category */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-300">Category</label>
                <select 
                  value={data.category} 
                  onChange={(e) => setData('category', e.target.value)} 
                  className="mt-1 block w-full rounded-md border-slate-600 bg-slate-700 text-slate-100 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                  <option value="other">Other (specify below)</option>
                </select>
                {data.category === 'other' && (
                  <div className="mt-2">
                    <input 
                      type="text" 
                      placeholder="Enter new category name" 
                      value={data.newCategory} 
                      onChange={(e) => setData('newCategory', e.target.value)} 
                      className="mt-1 block w-full rounded-md border-slate-600 bg-slate-700 text-slate-100 shadow-sm focus:border-blue-500 focus:ring-blue-500" 
                    />
                    {errors.newCategory && <p className="text-red-500 text-sm mt-1">{errors.newCategory}</p>}
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-300">Description</label>
                <div className="mt-1">
                  <ReactQuill 
                    ref={quillRef} 
                    value={data.description} 
                    onChange={handleDescriptionChange} 
                    modules={modules} 
                    theme="snow" 
                    className="bg-slate-800" 
                    style={{ minHeight: '200px' }} 
                  />
                </div>
                {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
              </div>

              {/* Image Upload */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-300">Image</label>
                {preview && (
                  <div className="mb-2">
                    <img 
                      src={preview} 
                      alt="Preview" 
                      className="w-40 h-40 object-cover rounded-md border" 
                    />
                    <button 
                      type="button" 
                      onClick={handleRemoveImage} 
                      className="mt-2 text-red-400 text-sm underline"
                    >
                      Remove Image
                    </button>
                  </div>
                )}
                <input 
                  type="file" 
                  onChange={handleFileChange} 
                  accept="image/*" 
                  className="mt-1 block w-full"
                />
                {errors.image && <p className="text-red-500 text-sm">{errors.image}</p>}
                {progress && (
                  <progress 
                    value={progress.percentage} 
                    max="100"
                    className="w-full mt-2"
                  >
                    {progress.percentage}%
                  </progress>
                )}
              </div>

              {/* Status */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300">Status</label>
                <select 
                  value={data.status} 
                  onChange={(e) => setData('status', e.target.value)} 
                  className="mt-1 block w-full rounded-md border-slate-600 bg-slate-700 text-slate-100 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="pending">Pending</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-2">
                <Link 
                  href={route('admin.news.index')} 
                  className="px-4 py-2 bg-slate-700 text-slate-300 rounded-md hover:bg-slate-600 border border-slate-600 transition-colors"
                >
                  Cancel
                </Link>
                <button 
                  type="submit" 
                  disabled={processing} 
                  className={`px-4 py-2 rounded-md text-white border ${processing ? 'bg-blue-400 border-blue-400' : 'bg-blue-600 hover:bg-blue-700 border-blue-600'} transition-colors`}
                >
                  {processing ? 'Updating...' : 'Update News'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}