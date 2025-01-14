import Link from 'next/link'
import styles from './page.module.scss'

export default function Home() {
  return (
    <main className={styles.main}>
      <h1>Agriculture Management System</h1>
      
      <nav className={styles.navigation}>
        <Link href="/clients" className={styles.navLink}>
          Manage Clients
        </Link>
        <Link href="/workers" className={styles.navLink}>
          Manage Workers
        </Link>
        <Link href="/fields" className={styles.navLink}>
          Manage Fields
        </Link>
        <Link href="/harvests" className={styles.navLink}>
          Manage Harvests
        </Link>
      </nav>
    </main>
  )
}
