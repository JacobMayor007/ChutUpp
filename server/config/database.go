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

	pb.createUserTable()
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

	funcTrig := `
		create or replace function setCreatedAt()
		returns trigger as $$
		begin
			new.created_at = NOW();
			return new;
		end;
		$$ language plpgsql;

		create or replace function set_timestamp()
		returns trigger AS $$
		begin
			new.updated_at = NOW();
			return new;
		end;
		$$ language plpgsql;
	`

	_, err = pb.Db.Exec(funcTrig)
	if err != nil {
		fmt.Printf("error in creating function trigger table: %s", err)

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
		fmt.Printf("error in trigger: %v", err)
	}
	return err
}

func (pb *PostgreDB) createChatTable() error {
	query := `create table if not exists chats (
		chat_id text primary key,
		lastMessage text,
		created_at timestamp default now(),
        updated_at timestamp default now()
	)`

	_, err := pb.Db.Exec(query)
	if err != nil {
		fmt.Printf("error in creating table: %s", err)
		return err
	}

	funcTrig := `
		create or replace function setCreatedAt()
		returns trigger as $$
		begin
			new.created_at = NOW();
			return new;
		end;
		$$ language plpgsql;

		create or replace function set_timestamp()
		returns trigger AS $$
		begin
			new.updated_at = NOW();
			return new;
		end;
		$$ language plpgsql;
	`

	_, err = pb.Db.Exec(funcTrig)
	if err != nil {
		fmt.Printf("error in creating function trigger table: %s", err)

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
		fmt.Printf("error in trigger: %v", err)
	}
	return err
}
