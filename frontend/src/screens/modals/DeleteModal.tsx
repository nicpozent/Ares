import { useStore } from '../../store'
import { Btn, Modal } from '../../components/ui'

export function DeleteModal() {
  const s = useStore()
  return (
    <Modal title="Delete incident" onClose={s.closeModal} width={440}>
      <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--muted)', marginBottom: 20 }}>
        Delete <strong style={{ color: 'var(--text)' }}>{s.deleteId}</strong> and all its timeline, hypotheses,
        evidence and corrective actions? This cannot be undone.
      </p>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <Btn onClick={s.closeModal}>Cancel</Btn>
        <Btn variant="hot" onClick={s.confirmDelete}>Delete incident</Btn>
      </div>
    </Modal>
  )
}
