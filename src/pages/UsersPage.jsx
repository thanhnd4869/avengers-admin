import { useState } from "react";
import { Link } from "react-router";

import { FilterTabs, ListState, Pagination, SearchBox } from "@components/ListControls";
import { PageHeading, RefreshButton } from "@components/PageParts";
import { useApi } from "@hooks/useApi";
import { getUsers } from "@services/adminService";
import { formatDate, formatMoney } from "@utils/format";

const FILTERS = [
  { value: "", label: "All accounts" },
  { value: "user", label: "Customers" },
  { value: "admin", label: "Admins" },
];

export default function UsersPage() {
  const [role, setRole] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { data, error, loading, refresh } = useApi(
    () => getUsers({ page, role, q: search }),
    `${page}|${role}|${search}`,
  );
  const users = data?.data ?? [];

  return (
    <>
      <PageHeading
        eyebrow="CUSTOMERS"
        title="Users"
        description="Accounts, their verification state and what they have bought."
        actions={<RefreshButton onClick={refresh} disabled={loading} />}
      />
      <section className="panel">
        <div className="inbox-toolbar">
          <FilterTabs
            items={FILTERS}
            value={role}
            label="Filter accounts"
            onChange={(value) => {
              setRole(value);
              setPage(1);
            }}
          />
          <SearchBox
            value={search}
            placeholder="Email or name"
            onChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
          />
        </div>
        <ListState
          loading={loading}
          error={error}
          empty={users.length === 0}
          emptyText="No accounts match."
        />
        {!loading && users.length > 0 ? (
          <div className="table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Account</th>
                  <th>Role</th>
                  <th>Email</th>
                  <th className="numeric">Orders</th>
                  <th className="numeric">Paid</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <Link className="row-link" to={`/users/${user.id}`}>
                        {user.displayName}
                        <span className="cell-sub">{user.email ?? "No email address"}</span>
                      </Link>
                    </td>
                    <td>
                      <span className={`status-pill role-${user.role}`}>{user.role}</span>
                    </td>
                    <td>
                      <span className={`status-pill ${user.emailVerified ? "status-paid" : ""}`}>
                        {user.emailVerified ? "Verified" : "Unverified"}
                      </span>
                    </td>
                    <td className="numeric">{user.orderCount}</td>
                    <td className="numeric">{formatMoney(user.totalSpent)}</td>
                    <td className="muted text-nowrap">{formatDate(user.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
        <Pagination meta={data?.meta} page={page} loading={loading} onChange={setPage} />
      </section>
    </>
  );
}
