import { Link } from 'react-router-dom'
import type { UserListItem } from '../../types/users'

interface UsersTableProps {
  users: UserListItem[]
}

function StatusBadge({ status }: { status: UserListItem['accountStatus'] }) {
  const active = status === 'ACTIVE'
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-sm font-semibold ${active ? 'bg-secondary/15 text-secondary' : 'bg-foreground/10 text-foreground/65'}`}>
      <span className="sr-only">Estado: </span>{active ? 'Activo' : 'Inactivo'}
    </span>
  )
}

export function UsersTable({ users }: UsersTableProps) {
  return (
    <>
      <div className="hidden overflow-x-auto rounded-lg border border-foreground/15 bg-background md:block">
        <table className="w-full border-collapse text-left">
          <caption className="sr-only">Empleados encontrados</caption>
          <thead className="bg-muted text-sm text-foreground/65">
            <tr>
              <th className="px-5 py-3 font-semibold" scope="col">Empleado</th>
              <th className="px-5 py-3 font-semibold" scope="col">Legajo</th>
              <th className="px-5 py-3 font-semibold" scope="col">Provincia</th>
              <th className="px-5 py-3 font-semibold" scope="col">Estado</th>
              <th className="px-5 py-3 text-right font-semibold" scope="col">Acción</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr className="border-t border-foreground/10" key={user.id}>
                <td className="min-w-64 px-5 py-4">
                  <p className="font-semibold text-foreground">{user.lastName}, {user.firstName}</p>
                  <p className="break-all text-sm text-foreground/60">{user.email}</p>
                </td>
                <td className="px-5 py-4 font-medium tabular-nums">{user.employeeId}</td>
                <td className="px-5 py-4">{user.site.name}</td>
                <td className="px-5 py-4"><StatusBadge status={user.accountStatus} /></td>
                <td className="px-5 py-4 text-right">
                  <Link className="inline-flex min-h-11 items-center rounded-md px-3 font-semibold text-primary hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" to={`/usuarios/${user.id}`}>Ver detalle</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="flex flex-col gap-3 md:hidden" aria-label="Empleados encontrados">
        {users.map((user) => (
          <li className="rounded-lg border border-foreground/15 bg-background p-4" key={user.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-semibold">{user.firstName} {user.lastName}</p>
                <p className="truncate text-sm text-foreground/60">{user.email}</p>
              </div>
              <StatusBadge status={user.accountStatus} />
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-foreground/60">Legajo</dt><dd className="font-medium tabular-nums">{user.employeeId}</dd></div>
              <div><dt className="text-foreground/60">Provincia</dt><dd className="font-medium">{user.site.name}</dd></div>
            </dl>
            <Link className="mt-4 flex min-h-11 items-center justify-center rounded-md border border-primary px-4 font-semibold text-primary hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" to={`/usuarios/${user.id}`}>Ver detalle</Link>
          </li>
        ))}
      </ul>
    </>
  )
}
