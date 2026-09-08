if (document.querySelector('#new-pet')) {
  const form = document.querySelector('#new-pet');
  const alertEl = document.getElementById('alert');

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const formData = new FormData(form);

    axios.post('/pets', formData)
      .then((response) => {
        window.location.replace(`/pets/${response.data.pet._id}`);
      })
      .catch((error) => {
        alertEl.classList.add('alert-warning');
        alertEl.textContent = 'Oops, something went wrong saving your pet. Please check your information and try again.';
        alertEl.style.display = 'block';

        setTimeout(() => {
          alertEl.style.display = 'none';
          alertEl.classList.remove('alert-warning');
        }, 3000);
      });
  });
}
