package repository

import (
	"fmt"
	database "websocket_server/config"
	"websocket_server/model"
)

type UserRepository interface {
	CreateUserAccount(*model.User) error
	IsIdExist(id string) error
	SearchUser(idOrEmail string) ([]model.User, error)
}

type UserDB struct {
	sqlDB *database.PostgreDB
}

func InitUserRepository(db *database.PostgreDB) *UserDB {
	return &UserDB{
		sqlDB: db,
	}
}

func (ub *UserDB) CreateUserAccount(user *model.User) error {
	query := `
        INSERT INTO users (user_id, email)
        VALUES ($1, $2)
    `
	_, err := ub.sqlDB.Db.Exec(query, user.UserUID, user.Email)
	return err
}

func (ub *UserDB) IsIdExist(id string) error {
	var exists bool

	query := `SELECT EXISTS(SELECT 1 FROM users WHERE user_id = $1)`

	// This scans 'true' or 'false' into the 'exists' variable
	err := ub.sqlDB.Db.QueryRow(query, id).Scan(&exists)

	// Check if the database query actually failed (syntax, connection, etc)
	if err != nil {
		return err
	}

	// Check the actual result of the EXISTS check
	if !exists {
		return fmt.Errorf("user with id %s not found", id)
	}

	return nil
}

func (ub *UserDB) SearchUser(searchTerm string) ([]model.User, error) {
	// Explicitly select only the columns you need
	query := `SELECT user_id, email FROM users WHERE user_id = $1 OR email ILIKE $2 LIMIT 20`

	// Add % wildcards for a partial search
	rows, err := ub.sqlDB.Db.Query(query, searchTerm, "%"+searchTerm+"%")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	users := make([]model.User, 0) // Ensures [] instead of null

	for rows.Next() {
		var u model.User
		if err := rows.Scan(&u.UserUID, &u.Email); err != nil {
			return nil, err
		}
		users = append(users, u)
	}
	return users, nil
}
