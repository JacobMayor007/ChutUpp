package database

import (
	"database/sql"
	"fmt"
	"os"

	_ "github.com/lib/pq"
)

type PostgreDB struct {
	Db *sql.DB
}

func NewPostgreDB() (*PostgreDB, error) {
	password := os.Getenv("PASSWORD")
	connStr := "user=postgres dbname=websocketdb password=" + password + " sslmode=disable"
	db, err := sql.Open("postgres", connStr)
	if err != nil {
		return nil, err
	}

	if err := db.Ping(); err != nil {
		return nil, err
	}

	return &PostgreDB{
		Db: db,
	}, nil
}

func (pb *PostgreDB) Init() error {
	_, err := pb.Db.Exec(`
		create extension if not exists "uuid-ossp"
	`)

	if err != nil {
		return err
	}

	if err := pb.createUserTable(); err != nil {
		return err
	}
	if err := pb.createChatTables(); err != nil {
		return err
	}
	return nil
}

func (pb *PostgreDB) createUserTable() error {
	query := `create table if not exists users (
		user_id text primary key,
		email text unique,
		created_at timestamp default now(),
        updated_at timestamp default now()
	)`

	_, err := pb.Db.Exec(query)
	if err != nil {
		fmt.Printf("error in creating table: %s", err)
		return err
	}

	trigger := `drop trigger if exists update_user_timestamp on users;
        create trigger update_user_timestamp
        before update on users
        for each row
        execute function set_timestamp();
		`
	_, err = pb.Db.Exec(trigger)

	if err != nil {
		fmt.Printf("error in trigger user table: %v", err)
	}
	return err
}

func (pb *PostgreDB) createChatTables() error {
	stChats := `CREATE TABLE IF NOT EXISTS chats (
        chat_id uuid primary key default uuid_generate_v4(),
        last_message text,
		user_id text references users(user_id),
        created_at timestamp DEFAULT NOW(),
        updated_at timestamp DEFAULT NOW()
    )`

	if _, err := pb.Db.Exec(stChats); err != nil {
		fmt.Printf("error in creating chats table: %s", err)
		return err
	}

	stChatParticipants := `
		CREATE TABLE IF NOT EXISTS chat_participants (
       	chat_id uuid references chats(chat_id) ON DELETE CASCADE,
		user_id text references users(user_id) ON DELETE CASCADE,
		created_at timestamp DEFAULT NOW(),
        updated_at timestamp DEFAULT NOW(),
		PRIMARY KEY (chat_id, user_id)
	)`

	if _, err := pb.Db.Exec(stChatParticipants); err != nil {
		fmt.Printf("error in creating chat participants table: %s", err)
		return err
	}

	trigger := `
        DROP TRIGGER IF EXISTS update_chat_timestamp ON chats;
        CREATE TRIGGER update_chat_timestamp
        BEFORE UPDATE ON chats
        FOR EACH ROW
        EXECUTE FUNCTION set_timestamp();
    `
	if _, err := pb.Db.Exec(trigger); err != nil {
		fmt.Printf("error in creating chats trigger: %s", err)
		return err
	}

	triggerParticipants := `
        DROP TRIGGER IF EXISTS update_participants_timestamp ON chat_participants;
        CREATE TRIGGER update_participants_timestamp
        BEFORE UPDATE ON chat_participants
        FOR EACH ROW
        EXECUTE FUNCTION set_timestamp();
    `
	_, err := pb.Db.Exec(triggerParticipants)
	return err
}
