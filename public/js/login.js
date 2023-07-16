/* eslint-disable */

const form = document.querySelector(".form");

const login = async (email, password) => {
  try {
    const res = await fetch("http://127.0.0.1:8000/api/v1/users/login", {
      headers: {
        "Content-Type": "application/json"
      },
      method: "POST",
      body: JSON.stringify({
        email,
        password
      })
    });
    console.log(res);
  } catch (err) {
    console.log(err);
  }
};

form.addEventListener("submit", e => {
  e.preventDefault();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  login(email, password);
});
