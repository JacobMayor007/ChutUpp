package repository

import (
	database "websocket_server/config"
	"websocket_server/model"
)

type UserRepository interface {
	CreateUserAccount(*model.User) error
	IsIdExist(id string) error
}

type UserDB struct {
	sqlDB *database.PostgreDB
}

func InitUserRepository(db *database.PostgreDB) *UserDB {
	return &UserDB{
		sqlDB: db,
	}
}

func (userDb *UserDB) CreateUserAccount(user *model.User) error {
	query := `
        INSERT INTO users (user_id, email)
        VALUES ($1, $2)
    `

	_, err := userDb.sqlDB.Db.Exec(query, user.UserUID, user.Email)
	return err
}

func (userDb *UserDB) IsIdExist(id string) error {
	var exists bool

	query := `
		SELECT EXISTS(SELECT 1 FROM users WHERE user_id = $1)
	`

	err := userDb.sqlDB.Db.QueryRow(query, id).Scan(&exists)

	if err != nil {
		return err
	}

	return nil
}
