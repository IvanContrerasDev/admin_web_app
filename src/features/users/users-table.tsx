import { Link } from 'react-router-dom'
import type { UserListItem } from '../../types/users'

interface UsersTableProps {
  users: UserListItem[]
}

function StatusBadge({ status }: { status: UserListItem['accountStatus'] }) {
  const active = status === 'ACTIVE'
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${active ? 'bg-secondary/15 text-secondary' : 'bg-foreground/10 text-foreground/65'}`}>
      <span className="sr-only">Estado: </span>{active ? 'Activo' : 'Inactivo'}
    </span>
  )
}

const actionLinkClass = 'inline-flex min-h-9 items-center rounded-md px-2 text-sm font-semibold text-primary hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'

export function UsersTable({ users }: UsersTableProps) {
  return (
    <>
      <div className="hidden overflow-x-auto rounded-lg border border-foreground/15 bg-background md:block">
        <table className="w-full border-collapse text-left text-sm">
          <caption className="sr-only">Empleados encontrados</caption>
          <thead className="bg-muted text-xs text-foreground/65">
            <tr>
              <th className="px-4 py-2 font-semibold" scope="col">Empleado</th>
              <th className="px-4 py-2 font-semibold" scope="col">Legajo</th>
              <th className="px-4 py-2 font-semibold" scope="col">Provincia</th>
              <th className="px-4 py-2 font-semibold" scope="col">Estado</th>
              <th className="px-4 py-2 font-semibold" scope="col">Ver Legajo</th>
              <th className="px-4 py-2 font-semibold" scope="col">Ver Planillas</th>
              <th className="px-4 py-2 text-right font-semibold" scope="col">Acción</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr className="border-t border-foreground/10" key={user.id}>
                <td className="min-w-56 px-4 py-2">
                  <p className="font-semibold text-foreground">{user.lastName}, {user.firstName}</p>
                  <p className="break-all text-xs text-foreground/60">{user.email}</p>
                </td>
                <td className="px-4 py-2 font-medium tabular-nums">{user.employeeId}</td>
                <td className="px-4 py-2">{user.site.name}</td>
                <td className="px-4 py-2"><StatusBadge status={user.accountStatus} /></td>
                <td className="px-4 py-2">
                  <Link className={actionLinkClass} to={`/usuarios/${user.id}/legajo`}>Ver legajo</Link>
                </td>
                <td className="px-4 py-2">
                  <Link className={actionLinkClass} to={`/planillas?employeeId=${user.id}`}>Ver planillas</Link>
                </td>
                <td className="px-4 py-2 text-right">
                  <Link className={actionLinkClass} to={`/usuarios/${user.id}`}>Ver detalle</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="flex flex-col gap-2 md:hidden" aria-label="Empleados encontrados">
        {users.map((user) => (
          <li className="rounded-lg border border-foreground/15 bg-background p-3" key={user.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-semibold">{user.firstName} {user.lastName}</p>
                <p className="truncate text-sm text-foreground/60">{user.email}</p>
              </div>
              <StatusBadge status={user.accountStatus} />
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div><dt className="text-foreground/60">Legajo</dt><dd className="font-medium tabular-nums">{user.employeeId}</dd></div>
              <div><dt className="text-foreground/60">Provincia</dt><dd className="font-medium">{user.site.name}</dd></div>
            </dl>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link className="flex min-h-10 flex-1 items-center justify-center rounded-md border border-primary px-3 text-sm font-semibold text-primary hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" to={`/usuarios/${user.id}`}>Detalle</Link>
              <Link className="flex min-h-10 flex-1 items-center justify-center rounded-md border border-foreground/25 px-3 text-sm font-semibold hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" to={`/usuarios/${user.id}/legajo`}>Legajo</Link>
              <Link className="flex min-h-10 flex-1 items-center justify-center rounded-md border border-foreground/25 px-3 text-sm font-semibold hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" to={`/planillas?employeeId=${user.id}`}>Planillas</Link>
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}
