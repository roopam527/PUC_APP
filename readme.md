### `POST`  /auth/login

### `POST` /auth/register

### `GET` /auth/current_user

### `PUT` /user/set_user_details

### `GET` /user/get_all_users
```

### `GET` /user/get_all_followers/:id

### `GET` /user/get_all_following/:id

 ```
### `GET` /user/get_user/:id

### `POST` /user/follow/:id

### `POST` /user/unfollow/:id

### `POST` /challenge/create

### `GET` /challenge/fetch/:username

### `GET` /challenge/fetch_challenges

### `PUT` /challenge/update/:id

### `DELETE` /challenge/delete/:id

### 'GET' challenge/available_challenges/:id

### 'PUT' challenge/result
{
	"challenge_id" : "5d2d9ed78a96200017d8816a",
	"id" : "5d25c858376dfa0017d93144",
	"status" : "ACCEPTED",
	"time" : "12.2155"
}