import React, { useEffect, useState } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '../../Layouts/AuthenticatedLayout';
import InputLabel from '../../Components/InputLabel';
import TextInput from '../../Components/TextInput';
import InputError from '../../Components/InputError';
import PrimaryButton from '../../Components/PrimaryButton';
import SecondaryButton from '../../Components/SecondaryButton';
import DangerButton from '../../Components/DangerButton';

export default function Categories() {
  const { categories = [] } = usePage().props;

  const createForm = useForm({
    name: '',
    description: '',
    is_active: true,
  });

  const [editing, setEditing] = useState(null);
  const editForm = useForm({
    name: '',
    description: '',
    is_active: true,
  });

  useEffect(() => {
    if (editing) {
      editForm.setData({
        name: editing.name ?? '',
        description: editing.description ?? '',
        is_active: Boolean(editing.is_active),
      });
    } else {
      editForm.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

  const handleCreate = (event) => {
    event.preventDefault();
    createForm.post(route('admin.categories.store'), {
      onSuccess: () => {
        createForm.reset();
        createForm.setData('is_active', true);
      },
      preserveScroll: true,
    });
  };

  const handleUpdate = (event) => {
    event.preventDefault();
    if (!editing) return;

    editForm.put(route('admin.categories.update', editing.id), {
      onSuccess: () => setEditing(null),
      preserveScroll: true,
    });
  };

  const handleDelete = (category) => {
    if (!confirm(`Delete category "${category.name}"?`)) return;
    router.delete(route('admin.categories.destroy', category.id), {
      preserveScroll: true,
      onSuccess: () => {
        if (editing?.id === category.id) {
          setEditing(null);
        }
      },
    });
  };

  return (
    <AuthenticatedLayout title="Manage Categories">
      <Head title="Manage Categories" />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Categories</h1>
            <p className="text-sm text-slate-500">Organize news stories by managing your category list.</p>
          </div>
          <SecondaryButton as={Link} href={route('admin.dashboard')}>
            Back to dashboard
          </SecondaryButton>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
          <form onSubmit={handleCreate} className="space-y-4 rounded-lg bg-white p-6 shadow">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Add category</h2>
              <p className="text-sm text-slate-500">Create a category that writers can assign to their articles.</p>
            </div>
            <div>
              <InputLabel htmlFor="create-name" value="Name" />
              <TextInput
                id="create-name"
                value={createForm.data.name}
                onChange={(e) => createForm.setData('name', e.target.value)}
                className="mt-1 w-full"
                required
              />
              <InputError message={createForm.errors.name} className="mt-2" />
            </div>
            <div>
              <InputLabel htmlFor="create-description" value="Description" />
              <textarea
                id="create-description"
                value={createForm.data.description}
                onChange={(e) => createForm.setData('description', e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              <InputError message={createForm.errors.description} className="mt-2" />
            </div>
            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={createForm.data.is_active}
                onChange={(e) => createForm.setData('is_active', e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              Active category
            </label>
            <InputError message={createForm.errors.is_active} className="mt-2" />
            <PrimaryButton disabled={createForm.processing}>Create category</PrimaryButton>
          </form>

          <div className="space-y-4 rounded-lg bg-white p-6 shadow">
            <h2 className="text-lg font-semibold text-slate-900">Existing categories</h2>
            <p className="text-sm text-slate-500">
              Edit or remove categories below. Deactivating a category hides it from article creation.
            </p>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-slate-500">Name</th>
                    <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-slate-500">Description</th>
                    <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-slate-500">Status</th>
                    <th className="px-4 py-3 text-right font-semibold uppercase tracking-wide text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {categories.length ? (
                    categories.map((category) => (
                      <tr key={category.id}>
                        <td className="px-4 py-3 font-medium text-slate-900">{category.name}</td>
                        <td className="px-4 py-3 text-slate-600">{category.description ?? '—'}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                              category.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {category.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <SecondaryButton type="button" onClick={() => setEditing(category)}>
                              Edit
                            </SecondaryButton>
                            <DangerButton type="button" onClick={() => handleDelete(category)}>
                              Delete
                            </DangerButton>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="px-4 py-6 text-center text-slate-500" colSpan={4}>
                        No categories yet. Create one using the form on the left.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {editing && (
              <form onSubmit={handleUpdate} className="space-y-4 rounded-lg border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-slate-900">Edit category</h3>
                  <SecondaryButton type="button" onClick={() => setEditing(null)}>
                    Close
                  </SecondaryButton>
                </div>
                <div>
                  <InputLabel htmlFor="edit-name" value="Name" />
                  <TextInput
                    id="edit-name"
                    value={editForm.data.name}
                    onChange={(e) => editForm.setData('name', e.target.value)}
                    className="mt-1 w-full"
                    required
                  />
                  <InputError message={editForm.errors.name} className="mt-2" />
                </div>
                <div>
                  <InputLabel htmlFor="edit-description" value="Description" />
                  <textarea
                    id="edit-description"
                    value={editForm.data.description ?? ''}
                    onChange={(e) => editForm.setData('description', e.target.value)}
                    rows={3}
                    className="mt-1 w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  <InputError message={editForm.errors.description} className="mt-2" />
                </div>
                <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={Boolean(editForm.data.is_active)}
                    onChange={(e) => editForm.setData('is_active', e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  Active category
                </label>
                <div className="flex items-center justify-end gap-3">
                  <SecondaryButton type="button" onClick={() => setEditing(null)} disabled={editForm.processing}>
                    Cancel
                  </SecondaryButton>
                  <PrimaryButton disabled={editForm.processing}>Update category</PrimaryButton>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
