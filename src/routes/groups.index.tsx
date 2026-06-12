import { createFileRoute, redirect } from '@tanstack/react-router'

/** /groups always means "the group flow" — land on Group A. */
export const Route = createFileRoute('/groups/')({
  beforeLoad: () => {
    throw redirect({ to: '/groups/$groupId', params: { groupId: 'A' } })
  },
})
