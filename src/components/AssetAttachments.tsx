import { useState, useRef, useCallback } from 'react'
import { Download, Trash2, Upload, FileText, ImageIcon, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import { cn } from '@/lib/utils'

interface AssetAttachmentsProps {
  assetId: string
  attachments: string[]
  onAttachmentsChange: (files: string[]) => void
}

export function AssetAttachments({
  assetId,
  attachments,
  onAttachmentsChange,
}: AssetAttachmentsProps) {
  const { toast } = useToast()
  const [isUploading, setIsUploading] = useState(false)
  const [deletingFile, setDeletingFile] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
  const MAX_SIZE = 5 * 1024 * 1024

  const getFileUrl = (filename: string) => {
    return pb.files.getURL({ id: assetId, collectionId: 'assets' } as any, filename)
  }

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase()
    if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext || '')) return ImageIcon
    return FileText
  }

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files)
      if (fileArray.length === 0) return

      for (const file of fileArray) {
        if (!ALLOWED_TYPES.includes(file.type)) {
          toast({
            title: 'Formato inválido',
            description: `${file.name}: apenas PDF, JPEG, PNG e WEBP são aceitos.`,
            variant: 'destructive',
          })
          return
        }
        if (file.size > MAX_SIZE) {
          toast({
            title: 'Arquivo muito grande',
            description: `${file.name}: o tamanho máximo é 5MB.`,
            variant: 'destructive',
          })
          return
        }
      }

      setIsUploading(true)
      try {
        const formData = new FormData()
        const currentAttachments = attachments || []
        for (const f of currentAttachments) {
          formData.append('attachments', f)
        }
        for (const file of fileArray) {
          formData.append('attachments', file)
        }

        const updated = await pb.collection('assets').update(assetId, formData)
        const newAttachments = (updated as any).attachments || []
        onAttachmentsChange(newAttachments)
        toast({
          title: 'Upload concluído',
          description:
            fileArray.length === 1
              ? `${fileArray[0].name} foi anexado.`
              : `${fileArray.length} arquivos foram anexados.`,
        })
      } catch (err) {
        toast({
          title: 'Erro no upload',
          description: 'Falha ao enviar arquivo(s). Tente novamente.',
          variant: 'destructive',
        })
      } finally {
        setIsUploading(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    },
    [assetId, attachments, onAttachmentsChange, toast],
  )

  const handleDelete = async (filename: string) => {
    setDeletingFile(filename)
    try {
      const formData = new FormData()
      const remaining = (attachments || []).filter((f) => f !== filename)
      for (const f of remaining) {
        formData.append('attachments', f)
      }
      const updated = await pb.collection('assets').update(assetId, formData)
      const newAttachments = (updated as any).attachments || []
      onAttachmentsChange(newAttachments)
      toast({
        title: 'Arquivo removido',
        description: `${filename} foi excluído.`,
      })
    } catch (err) {
      toast({
        title: 'Erro ao remover',
        description: 'Falha ao excluir o arquivo. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setDeletingFile(null)
    }
  }

  const handleDownload = async (filename: string) => {
    try {
      const url = getFileUrl(filename)
      const res = await fetch(url, {
        headers: { Authorization: pb.authStore.token || '' },
      })
      if (!res.ok) throw new Error('download failed')
      const blob = await res.blob()
      const objectUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = objectUrl
      a.download = filename
      a.click()
      URL.revokeObjectURL(objectUrl)
    } catch {
      window.open(getFileUrl(filename), '_blank')
    }
  }

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files)
      }
    },
    [handleFiles],
  )

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  return (
    <div className="space-y-3">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={cn(
          'border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition-colors',
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50 hover:bg-muted/30',
          isUploading && 'pointer-events-none opacity-60',
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
        {isUploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">Enviando...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-6 w-6 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              Arraste arquivos ou <span className="text-primary">clique para selecionar</span>
            </p>
            <p className="text-[0.65rem] text-muted-foreground/70">
              PDF, JPEG, PNG, WEBP · máx 5MB por arquivo
            </p>
          </div>
        )}
      </div>

      {attachments && attachments.length > 0 && (
        <div className="space-y-2">
          {attachments.map((filename, idx) => {
            const Icon = getFileIcon(filename)
            const isDeleting = deletingFile === filename
            return (
              <div
                key={filename + idx}
                className="flex items-center justify-between gap-2 rounded-md border border-border/60 bg-background px-3 py-2"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <Icon size={16} className="text-muted-foreground shrink-0" />
                  <span className="text-xs truncate">{filename}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleDownload(filename)}
                    title="Baixar / Visualizar"
                  >
                    <Download size={14} />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 hover:text-destructive"
                    onClick={() => handleDelete(filename)}
                    disabled={isDeleting}
                    title="Excluir"
                  >
                    {isDeleting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
