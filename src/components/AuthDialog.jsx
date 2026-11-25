import AuthForm from './AuthForm.jsx'
import Dialog from './Dialog.jsx'

export default function AuthDialog({ open, reason, onClose, onDone }) {
  return (
    <Dialog open={open} onClose={onClose} kicker="Your account" title={reason || 'Sign in to Chaska'} width="26rem">
      <div className="px-5 py-5">
        <AuthForm onDone={onDone} />
      </div>
    </Dialog>
  )
}
