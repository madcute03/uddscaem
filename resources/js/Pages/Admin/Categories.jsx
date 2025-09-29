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

      <div className="space-y-6 text-slate-100">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">Categories</h1>
            <p className="text-sm text-slate-400">Organize news stories by managing your category list.</p>
          </div>
          <SecondaryButton as={Link} href={route('admin.dashboard')} className="self-start sm:self-auto">
            Back
          </SecondaryButton>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
          <form
            onSubmit={handleCreate}
            className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg shadow-slate-950/30 backdrop-blur"
          >
            <div>
              <h2 className="text-lg font-semibold text-white">Add category</h2>
              <p className="text-sm text-slate-400">Create a category that writers can assign to their articles.</p>
            </div>
            <div>
              <InputLabel htmlFor="create-name" value="Name" className="text-slate-300" />
              <TextInput
                id="create-name"
                value={createForm.data.name}
                onChange={(e) => createForm.setData('name', e.target.value)}
                className="mt-1 w-full border-slate-700 bg-slate-800 text-slate-100 focus:border-blue-500 focus:ring-blue-500"
                required
              />
              <InputError message={createForm.errors.name} className="mt-2" />
            </div>
            <div>
              <InputLabel htmlFor="create-description" value="Description" className="text-slate-300" />
              <textarea
                id="create-description"
                value={createForm.data.description}
                onChange={(e) => createForm.setData('description', e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-md border-slate-700 bg-slate-800 text-slate-100 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              <InputError message={createForm.errors.description} className="mt-2" />
            </div>
            <label className="inline-flex items-center gap-2 text-sm text-slate-200">
              <input
                type="checkbox"
                checked={createForm.data.is_active}
                onChange={(e) => createForm.setData('is_active', e.target.checked)}
                className="rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500"
              />
              Active category
            </label>
            <InputError message={createForm.errors.is_active} className="mt-2" />
            <PrimaryButton disabled={createForm.processing}>Create category</PrimaryButton>
          </form>

          <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg shadow-slate-950/30 backdrop-blur">
            <h2 className="text-lg font-semibold text-white">Existing categories</h2>
            <p className="text-sm text-slate-400">
              Edit or remove categories below. Deactivating a category hides it from article creation.
            </p>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-800 text-sm text-slate-200">
                <thead className="bg-slate-900/80">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-slate-300">Name</th>
                    <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-slate-300">Description</th>
                    <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-slate-300">Status</th>
                    <th className="px-4 py-3 text-right font-semibold uppercase tracking-wide text-slate-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {categories.length ? (
                    categories.map((category) => (
                      <tr key={category.id}>
                        <td className="px-4 py-3 font-medium text-white">{category.name}</td>
                        <td className="px-4 py-3 text-slate-300">{category.description ?? '—'}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                              category.is_active ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/40' : 'bg-slate-700/40 text-slate-300 border border-slate-600/40'
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
                      <td className="px-4 py-6 text-center text-slate-400" colSpan={4}>
                        No categories yet. Create one using the form on the left.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {editing && (
              <form onSubmit={handleUpdate} className="space-y-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="text-base font-semibold text-white">Edit category</h3>
                  <SecondaryButton type="button" onClick={() => setEditing(null)}>
                    Close
                  </SecondaryButton>
                </div>
                <div>
                  <InputLabel htmlFor="edit-name" value="Name" className="text-slate-300" />
                  <TextInput
                    id="edit-name"
                    value={editForm.data.name}
                    onChange={(e) => editForm.setData('name', e.target.value)}
                    className="mt-1 w-full border-slate-700 bg-slate-800 text-slate-100 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                  <InputError message={editForm.errors.name} className="mt-2" />
                </div>
                <div>
                  <InputLabel htmlFor="edit-description" value="Description" className="text-slate-300" />
                  <textarea
                    id="edit-description"
                    value={editForm.data.description ?? ''}
                    onChange={(e) => editForm.setData('description', e.target.value)}
                    rows={3}
                    className="mt-1 w-full rounded-md border-slate-700 bg-slate-800 text-slate-100 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  <InputError message={editForm.errors.description} className="mt-2" />
                </div>
                <label className="inline-flex items-center gap-2 text-sm text-slate-200">
                  <input
                    type="checkbox"
                    checked={Boolean(editForm.data.is_active)}
                    onChange={(e) => editForm.setData('is_active', e.target.checked)}
                    className="rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500"
                  />
                  Active category
                </label>
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <SecondaryButton
                    type="button"
                    onClick={() => setEditing(null)}
                    disabled={editForm.processing}
                    className="justify-center"
                  >
                    Cancel
                  </SecondaryButton>
                  <PrimaryButton disabled={editForm.processing} className="justify-center">
                    Update category
                  </PrimaryButton>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
