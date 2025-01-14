import { getClients } from '../actions/clients'
import ClientList from './components/ClientList'
import CreateClientForm from './components/CreateClientForm'
import styles from './page.module.scss'

export default async function ClientsPage() {
  const clients = await getClients()

  return (
    <main className={styles.main}>
      <h1>Client Management</h1>
      
      <section className={styles.createSection}>
        <h2>Add New Client</h2>
        <CreateClientForm />
      </section>

      <section className={styles.listSection}>
        <h2>Client List</h2>
        <ClientList clients={clients} />
      </section>
    </main>
  )
} 