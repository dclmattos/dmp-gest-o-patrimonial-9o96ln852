import { useState, useEffect, useCallback } from 'react'
import { Users as UsersIcon, Plus, Pencil, Shield, User as UserIcon, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getUsers, updateUser } from '@/services/users'
import { useRealtime } from '@/hooks/use-realtime'
import { useToast } from '@/hooks/use-toast'
import { Switch } from '@/components/ui/switch'
import { UserDialog } from '@/components/UserDialog'
import { DeleteUserDialog } from '@/components/DeleteUserDialog'
import { useAuth } from '@/hooks/use-auth'

interface UserRecord {
  id: string
  name: string
  email: string
  role: string
  created: string
  can_edit_data?: boolean
}

export default function Users() {
  const [users, setUsers] = useState<UserRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null)
  const { user: currentUser } = useAuth()
  const { toast } = useToast()

  const handleToggleEditPermission = async (userId: string, canEdit: boolean) => {
    try {
      await updateUser(userId, { can_edit_data: canEdit })
      toast({ title: 'Sucesso', description: 'Permissão de edição atualizada com sucesso.' })
      loadUsers()
    } catch {
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar permissão.',
        variant: 'destructive',
      })
    }
  }

  const loadUsers = useCallback(async () => {
    try {
      const data = await getUsers()
      setUsers(data as UserRecord[])
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  useRealtime('users', loadUsers)

  const handleCreate = () => {
    setEditingUser(null)
    setDialogOpen(true)
  }

  const handleEdit = (user: UserRecord) => {
    setEditingUser(user)
    setDialogOpen(true)
  }

  const adminCount = users.filter((u) => u.role === 'admin').length
  const clientCount = users.filter((u) => u.role === 'user').length

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl text-foreground flex items-center gap-2">
            <UsersIcon size={24} className="text-primary" />
            Gestão de Usuários
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie clientes e administradores do sistema.
          </p>
        </div>
        {currentUser?.role === 'admin' && (
          <Button onClick={handleCreate} className="gap-2 shadow-subtle">
            <Plus size={16} />
            Novo Usuário
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Usuários
            </CardTitle>
            <UsersIcon size={16} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Administradores
            </CardTitle>
            <Shield size={16} className="text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Clientes</CardTitle>
            <UserIcon size={16} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Carregando usuários...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Permissão de Edição</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      Nenhum usuário encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((u) => (
                    <TableRow key={u.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-medium">{u.name || '—'}</TableCell>
                      <TableCell className="p-4 align-middle text-muted-foreground">
                        {u.email || '—'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={u.role === 'admin' ? 'default' : 'secondary'}
                          className="gap-1"
                        >
                          {u.role === 'admin' ? <Shield size={12} /> : <UserIcon size={12} />}
                          {u.role === 'admin' ? 'Administrador' : 'Cliente'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {currentUser?.role === 'admin' ? (
                          <Switch
                            checked={u.role === 'admin' ? true : !!u.can_edit_data}
                            disabled={u.role === 'admin'}
                            onCheckedChange={(checked) => handleToggleEditPermission(u.id, checked)}
                          />
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {u.can_edit_data ? 'Sim' : 'Não'}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-primary"
                            onClick={() => handleEdit(u)}
                            title="Editar usuário"
                          >
                            <Pencil size={16} />
                          </Button>
                          {currentUser?.id !== u.id && (
                            <DeleteUserDialog
                              userId={u.id}
                              userName={u.name || u.email}
                              onDeleted={loadUsers}
                            />
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <UserDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        user={editingUser}
        onSaved={loadUsers}
      />
    </div>
  )
}
