import React, { useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import Modal, { Field, TextInput, Select } from "./_Modal";
import {
  Plus,
  User,
  Search,
  Pencil,
  Phone,
  Mail,
  ShieldCheck,
  UserCheck,
  UserX,
} from "lucide-react";

const ROLES_OPT = [
  { value: "super_admin", label: "Super Admin" },
  { value: "admin", label: "Admin / Showroom" },
  { value: "sales", label: "Consilier vânzări" },
  { value: "technician", label: "Tehnician" },
];

const ROLE_LABELS = Object.fromEntries(
  ROLES_OPT.map(({ value, label }) => [value, label])
);

const ROLE_FILTER_OPTIONS = [
  { value: "", label: "Toate rolurile" },
  ...ROLES_OPT,
];

const STATUS_FILTER_OPTIONS = [
  { value: "", label: "Toate statusurile" },
  { value: "active", label: "Activi" },
  { value: "inactive", label: "Inactivi" },
];

const EMPTY = {
  email: "",
  name: "",
  phone: "",
  role: "technician",
  password: "",
  active: true,
};

export default function AdminEmployees() {
  const [rows, setRows] = useState([]);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...EMPTY });

  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const load = async () => {
    setListLoading(true);

    try {
      const { data } = await api.get("/users");

      setRows(
        (data || []).filter((user) => user.role !== "client")
      );
    } catch (err) {
      console.error("Eroare la încărcarea angajaților:", err);

      toast.error(
        err?.response?.data?.detail ||
          "Nu am putut încărca lista de angajați"
      );
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredRows = useMemo(() => {
    const search = q.trim().toLowerCase();

    return rows.filter((employee) => {
      const matchesSearch =
        !search ||
        employee.name?.toLowerCase().includes(search) ||
        employee.email?.toLowerCase().includes(search) ||
        employee.phone?.toLowerCase().includes(search) ||
        ROLE_LABELS[employee.role]
          ?.toLowerCase()
          .includes(search);

      const matchesRole =
        !roleFilter || employee.role === roleFilter;

      const matchesStatus =
        !statusFilter ||
        (statusFilter === "active" && employee.active) ||
        (statusFilter === "inactive" && !employee.active);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [rows, q, roleFilter, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: rows.length,
      active: rows.filter((employee) => employee.active).length,
      inactive: rows.filter((employee) => !employee.active).length,
      technicians: rows.filter(
        (employee) => employee.role === "technician"
      ).length,
    };
  }, [rows]);

  const openCreateModal = () => {
    setEditing(null);
    setForm({ ...EMPTY });
    setOpen(true);
  };

  const openEditModal = (employee) => {
    setEditing(employee);

    setForm({
      email: employee.email || "",
      name: employee.name || "",
      phone: employee.phone || "",
      role: employee.role || "technician",
      password: "",
      active: employee.active !== false,
    });

    setOpen(true);
  };

  const closeModal = () => {
    if (loading) {
      return;
    }

    setOpen(false);
    setEditing(null);
    setForm({ ...EMPTY });
  };

  const submit = async (event) => {
    event.preventDefault();

    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();
    const phone = form.phone.trim();
    const password = form.password.trim();

    if (!name) {
      toast.error("Completează numele angajatului");
      return;
    }

    if (!email) {
      toast.error("Completează adresa de email");
      return;
    }

    if (!editing && password.length < 6) {
      toast.error("Parola trebuie să aibă minimum 6 caractere");
      return;
    }

    if (editing && password && password.length < 6) {
      toast.error("Noua parolă trebuie să aibă minimum 6 caractere");
      return;
    }

    setLoading(true);

    try {
      if (editing) {
        const payload = {
          name,
          email,
          phone,
          role: form.role,
          active: form.active,
        };

        if (password) {
          payload.password = password;
        }

        await api.patch(`/users/${editing.id}`, payload);

        toast.success("Angajatul a fost actualizat");
      } else {
        await api.post("/users", {
          name,
          email,
          phone,
          role: form.role,
          password,
          active: form.active,
        });

        toast.success("Angajatul a fost creat");
      }

      setOpen(false);
      setEditing(null);
      setForm({ ...EMPTY });

      await load();
    } catch (err) {
      console.error("Eroare la salvarea angajatului:", err);

      toast.error(
        err?.response?.data?.detail ||
          (editing
            ? "Nu am putut actualiza angajatul"
            : "Nu am putut crea angajatul")
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleEmployee = async (employee) => {
    const nextStatus = !employee.active;

    const confirmed = window.confirm(
      nextStatus
        ? `Activezi contul angajatului „${employee.name}”?`
        : `Dezactivezi contul angajatului „${employee.name}”?\n\nAngajatul nu se va mai putea autentifica în aplicație.`
    );

    if (!confirmed) {
      return;
    }

    setActionLoadingId(employee.id);

    try {
      await api.patch(`/users/${employee.id}`, {
        active: nextStatus,
      });

      toast.success(
        nextStatus
          ? "Angajatul a fost activat"
          : "Angajatul a fost dezactivat"
      );

      await load();
    } catch (err) {
      console.error("Eroare la schimbarea statusului:", err);

      toast.error(
        err?.response?.data?.detail ||
          "Nu am putut schimba statusul angajatului"
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div
      className="space-y-6 animate-fade-in"
      data-testid="page-employees"
    >
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.28em] text-aj-navy/60 mb-1">
            Echipă
          </div>

          <h1 className="text-3xl font-extrabold text-aj-navy tracking-tight">
            Angajați
          </h1>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="aj-btn-gold px-4 py-2.5 rounded-lg flex items-center gap-2"
          data-testid="btn-new-employee"
        >
          <Plus size={16} />
          Angajat nou
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="aj-card p-4">
          <div className="text-xs uppercase tracking-wider text-slate-500">
            Total angajați
          </div>

          <div className="mt-2 text-2xl font-extrabold text-aj-navy">
            {stats.total}
          </div>
        </div>

        <div className="aj-card p-4">
          <div className="text-xs uppercase tracking-wider text-slate-500">
            Activi
          </div>

          <div className="mt-2 text-2xl font-extrabold text-emerald-700">
            {stats.active}
          </div>
        </div>

        <div className="aj-card p-4">
          <div className="text-xs uppercase tracking-wider text-slate-500">
            Inactivi
          </div>

          <div className="mt-2 text-2xl font-extrabold text-slate-500">
            {stats.inactive}
          </div>
        </div>

        <div className="aj-card p-4">
          <div className="text-xs uppercase tracking-wider text-slate-500">
            Tehnicieni
          </div>

          <div className="mt-2 text-2xl font-extrabold text-aj-navy">
            {stats.technicians}
          </div>
        </div>
      </div>

      <div className="aj-card p-3 flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            className="aj-input pl-9"
            placeholder="Caută după nume, email, telefon sau rol…"
            data-testid="employee-search"
          />
        </div>

        <Select
          value={roleFilter}
          onChange={(event) =>
            setRoleFilter(event.target.value)
          }
          options={ROLE_FILTER_OPTIONS}
          className="lg:w-56"
        />

        <Select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value)
          }
          options={STATUS_FILTER_OPTIONS}
          className="lg:w-48"
        />
      </div>

      <div className="aj-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-aj-cream/60">
              <tr className="text-left text-xs uppercase text-slate-500">
                <th className="px-4 py-3">Angajat</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">
                  Acțiuni
                </th>
              </tr>
            </thead>

            <tbody>
              {listLoading && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-slate-400"
                  >
                    Se încarcă angajații…
                  </td>
                </tr>
              )}

              {!listLoading && filteredRows.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-slate-400"
                  >
                    Nu am găsit niciun angajat pentru filtrele
                    selectate.
                  </td>
                </tr>
              )}

              {!listLoading &&
                filteredRows.map((employee) => {
                  const isActionLoading =
                    actionLoadingId === employee.id;

                  return (
                    <tr
                      key={employee.id}
                      className="border-t border-aj-line hover:bg-aj-cream/40"
                      data-testid={`employee-${employee.id}`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-aj-navy/10 flex items-center justify-center shrink-0">
                            <User
                              size={17}
                              className="text-aj-gold"
                            />
                          </div>

                          <div>
                            <div className="font-semibold text-aj-navy">
                              {employee.name}
                            </div>

                            <div className="text-xs text-slate-500">
                              Cont de angajat
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-xs text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Mail size={13} />
                          {employee.email || "-"}
                        </div>

                        <div className="flex items-center gap-1.5 mt-1">
                          <Phone size={13} />
                          {employee.phone || "-"}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <ShieldCheck
                            size={14}
                            className="text-aj-gold"
                          />

                          <span>
                            {ROLE_LABELS[employee.role] ||
                              ROLES_OPT.find(
                                (role) =>
                                  role.value === employee.role
                              )?.label ||
                              employee.role}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`aj-badge ${
                            employee.active
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-gray-100 text-gray-500 border-gray-200"
                          }`}
                        >
                          {employee.active ? "Activ" : "Inactiv"}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            title="Editează angajatul"
                            aria-label={`Editează ${employee.name}`}
                            disabled={isActionLoading}
                            onClick={() =>
                              openEditModal(employee)
                            }
                            className="p-2 rounded-lg text-slate-600 hover:text-blue-700 hover:bg-blue-100 transition-colors disabled:opacity-40"
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            type="button"
                            title={
                              employee.active
                                ? "Dezactivează contul"
                                : "Activează contul"
                            }
                            aria-label={
                              employee.active
                                ? `Dezactivează ${employee.name}`
                                : `Activează ${employee.name}`
                            }
                            disabled={isActionLoading}
                            onClick={() =>
                              toggleEmployee(employee)
                            }
                            className={`p-2 rounded-lg transition-colors disabled:opacity-40 ${
                              employee.active
                                ? "text-slate-600 hover:text-red-700 hover:bg-red-100"
                                : "text-slate-600 hover:text-emerald-700 hover:bg-emerald-100"
                            }`}
                          >
                            {employee.active ? (
                              <UserX size={16} />
                            ) : (
                              <UserCheck size={16} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={open}
        onClose={closeModal}
        title={editing ? "Editează angajat" : "Angajat nou"}
        testId="modal-employee"
      >
        <form
          onSubmit={submit}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <Field label="Nume" wide>
            <TextInput
              required
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
            />
          </Field>

          <Field label="Email">
            <TextInput
              type="email"
              required
              value={form.email}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  email: event.target.value,
                }))
              }
            />
          </Field>

          <Field label="Telefon">
            <TextInput
              value={form.phone}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  phone: event.target.value,
                }))
              }
              placeholder="+40..."
            />
          </Field>

          <Field label="Rol">
            <Select
              value={form.role}
              options={ROLES_OPT}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  role: event.target.value,
                }))
              }
            />
          </Field>

          <Field
            label={
              editing
                ? "Parolă nouă (opțional)"
                : "Parolă"
            }
          >
            <TextInput
              type="password"
              required={!editing}
              value={form.password}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  password: event.target.value,
                }))
              }
              placeholder={
                editing
                  ? "Lasă gol pentru a păstra parola"
                  : "Minimum 6 caractere"
              }
            />
          </Field>

          <Field label="Status cont">
            <Select
              value={form.active ? "active" : "inactive"}
              options={[
                { value: "active", label: "Activ" },
                { value: "inactive", label: "Inactiv" },
              ]}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  active: event.target.value === "active",
                }))
              }
            />
          </Field>

          <div className="col-span-full flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={closeModal}
              disabled={loading}
              className="px-4 py-2 rounded-lg border border-aj-line text-sm disabled:opacity-50"
            >
              Anulează
            </button>

            <button
              type="submit"
              disabled={loading}
              className="aj-btn-navy px-4 py-2 rounded-lg text-sm disabled:opacity-60"
              data-testid="btn-save-employee"
            >
              {loading
                ? "Se salvează…"
                : editing
                  ? "Salvează modificările"
                  : "Salvează angajat"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
