let selectedUserId: string | null = null

export const getSelectedUserId = () => selectedUserId
export const setSelectedUserId = (id: string | null) => {
  selectedUserId = id
}
