import React, { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Pagination from '../../Components/Pagination';
import SecondaryButton from '@/Components/SecondaryButton';
import { Link } from '@inertiajs/react';

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
    router.post(route('admin.writers.store'), form, {
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
      router.delete(route('admin.writers.destroy', writer.id), { preserveScroll: true });
    }
  };

  return (
    <AuthenticatedLayout
      header={<h2 className="text-2xl font-semibold text-slate-100">Writers</h2>}
    >
      <Head title="Writers" />

      <div className="space-y-6 text-slate-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">Writer Management</h1>
            <p className="text-sm text-slate-400">Manage contributors and invite new writers.</p>
          </div>
          <SecondaryButton as={Link} href={route('admin.dashboard')}>
            Back
          </SecondaryButton>
        </div>

        <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
          <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg shadow-slate-950/30 backdrop-blur">
            <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-slate-100">
              <div>
                <h2 className="text-xl font-semibold text-white">Writer roster</h2>
                <p className="text-sm text-slate-400">Manage newsroom contributors and access.</p>
              </div>
              <form method="get" className="flex items-center gap-2">
                <input
                  type="search"
                  name="search"
                  defaultValue={filters?.search ?? ''}
                  placeholder="Search writers"
                  className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-lg bg-blue-500/80 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
                >
                  Search
                </button>
              </form>
            </header>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-800 text-sm text-slate-100">
                <thead className="bg-slate-900">
                  <tr>
                    <Th>Name</Th>
                    <Th>Email</Th>
                    <Th>Bio</Th>
                    <Th className="text-right">Actions</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {writers.data.length ? (
                    writers.data.map((writer) => (
                      <tr key={writer.id}>
                        <Td className="font-semibold text-white">{writer.name}</Td>
                        <Td>{writer.email}</Td>
                        <Td>
                          <p className="line-clamp-2 text-slate-300">{writer.bio ?? '—'}</p>
                        </Td>
                        <Td>
                          <div className="flex items-center justify-end gap-3">
                            <button
                              type="button"
                              onClick={() => router.visit(route('admin.writers.update', writer.id))}
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
                      <Td colSpan={4} className="py-8 text-center text-slate-400">
                        No writers found.
                      </Td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <Pagination links={writers.links} />
          </section>

          <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg shadow-slate-950/30">
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
                className="inline-flex w-full items-center justify-center rounded-md bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-400"
              >
                Create writer
              </button>
            </form>
          </section>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}

function Th({ children, className = '' }) {
  return (
    <th scope="col" className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-300 ${className}`}>
      {children}
    </th>
  );
}

function Td({ children, className = '', ...props }) {
  return (
    <td className={`px-4 py-3 align-top text-sm text-slate-200 ${className}`} {...props}>
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
        className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        {...props}
      />
    </div>
  );
}
