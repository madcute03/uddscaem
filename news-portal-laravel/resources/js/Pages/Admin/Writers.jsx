import React, { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import Pagination from '../../Components/Pagination';

export default function Writers() {
  const { writers, filters } = usePage().props;
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    bio: '',
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    router.post('/admin/writers', form, {
      preserveScroll: true,
      onSuccess: () =>
        setForm({
          name: '',
          email: '',
          password: '',
          password_confirmation: '',
          bio: '',
        }),
    });
  };

  const handleDelete = (writer) => {
    if (confirm(`Remove writer "${writer.name}"?`)) {
      router.delete(`/admin/writers/${writer.id}`, { preserveScroll: true });
    }
  };

  return (
    <AppLayout title="Writers">
      <Head title="Writers" />
      <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
        <section className="space-y-4 bg-white rounded-lg shadow p-6">
          <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Writer roster</h2>
              <p className="text-sm text-slate-500">Manage newsroom contributors and access.</p>
            </div>
            <form method="get" className="flex items-center gap-2">
              <input
                type="search"
                name="search"
                defaultValue={filters?.search ?? ''}
                placeholder="Search writers"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-md bg-blue-600 text-white text-sm font-semibold px-3 py-2 hover:bg-blue-500"
              >
                Search
              </button>
            </form>
          </header>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <Th>Name</Th>
                  <Th>Email</Th>
                  <Th>Bio</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {writers.data.length ? (
                  writers.data.map((writer) => (
                    <tr key={writer.id}>
                      <Td className="font-semibold text-slate-900">{writer.name}</Td>
                      <Td>{writer.email}</Td>
                      <Td>
                        <p className="line-clamp-2 text-slate-600">{writer.bio ?? '—'}</p>
                      </Td>
                      <Td>
                        <div className="flex items-center justify-end gap-3">
                          <button
                            type="button"
                            onClick={() => router.visit(`/admin/writers/${writer.id}/edit`)}
                            className="text-sm text-blue-600 hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(writer)}
                            className="text-sm text-red-600 hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                      </Td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <Td colSpan={4} className="text-center text-slate-500 py-8">
                      No writers found.
                    </Td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Pagination links={writers.links} />
        </section>

        <section className="bg-slate-900 text-white rounded-lg shadow p-6 space-y-4">
          <header className="space-y-1">
            <h2 className="text-lg font-semibold">Invite writer</h2>
            <p className="text-sm text-slate-200">
              Create an account for newsroom contributors. They'll receive a verification email if mail is configured.
            </p>
          </header>
          <form onSubmit={handleSubmit} className="space-y-4">
            <TextField label="Name" name="name" value={form.name} onChange={handleChange} required />
            <TextField label="Email" type="email" name="email" value={form.email} onChange={handleChange} required />
            <TextField label="Password" type="password" name="password" value={form.password} onChange={handleChange} required />
            <TextField
              label="Confirm password"
              type="password"
              name="password_confirmation"
              value={form.password_confirmation}
              onChange={handleChange}
              required
            />
            <div>
              <label className="block text-sm font-semibold mb-1" htmlFor="bio">
                Bio
              </label>
              <textarea
                id="bio"
                name="bio"
                value={form.bio}
                onChange={handleChange}
                rows={3}
                className="w-full rounded-md border border-slate-300 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-slate-300 focus:border-blue-300 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center rounded-md bg-blue-500 text-white text-sm font-semibold px-4 py-2 hover:bg-blue-400"
            >
              Create writer
            </button>
          </form>
        </section>
      </div>
    </AppLayout>
  );
}

function Th({ children, className = '' }) {
  return (
    <th scope="col" className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 ${className}`}>
      {children}
    </th>
  );
}

function Td({ children, className = '', ...props }) {
  return (
    <td className={`px-4 py-3 align-top text-sm text-slate-700 ${className}`} {...props}>
      {children}
    </td>
  );
}

function TextField({ label, name, value, onChange, type = 'text', ...props }) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-1" htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        className="w-full rounded-md border border-slate-300 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-slate-300 focus:border-blue-300 focus:outline-none"
        {...props}
      />
    </div>
  );
}
