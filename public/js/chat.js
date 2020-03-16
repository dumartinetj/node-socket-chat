const socket = io();

const $chatForm = document.querySelector("#chatForm");
const $chatFormInput = $chatForm.querySelector("input");
const $chatFormButton = $chatForm.querySelector("button");
const $locationButton = document.querySelector("#locationButton");
const $messages = document.querySelector("#messages");
const $sidebar = document.querySelector("#sidebar");

// Templates
const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationTemplate = document.querySelector("#location-template").innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;

// Data
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true
});

const autoscroll = () => {
  const $newMessage = $messages.lastElementChild;

  const newMessageStyles = getComputedStyle($newMessage);
  const newMessageHeight =
    $newMessage.offsetHeight + parseInt(newMessageStyles.marginBottom);

  const visibleHeight = $messages.offsetHeight;

  const containerHeight = $messages.scrollHeight;

  const scrollOffset = $messages.scrollTop + visibleHeight;

  if (containerHeight - newMessageHeight <= scrollOffset) {
    $messages.scrollTop = $messages.scrollHeight;
  }
};

$chatForm.addEventListener("submit", e => {
  e.preventDefault();

  $chatFormButton.setAttribute("disabled", "disabled");

  socket.emit("sendMessage", $chatFormInput.value, error => {
    $chatFormButton.removeAttribute("disabled");
    $chatFormInput.value = "";
    $chatFormInput.focus();
    console.log(error ? error : "Message sent !");
  });
});

socket.on("message", message => {
  const messageContent = Mustache.render(messageTemplate, {
    username: message.username,
    content: message.content,
    sentAt: moment(message.sentAt).format("HH:mm")
  });
  $messages.insertAdjacentHTML("beforeend", messageContent);
  autoscroll();
});

socket.on("locationMessage", message => {
  const locationContent = Mustache.render(locationTemplate, {
    username: message.username,
    url: message.url,
    sentAt: moment(message.sentAt).format("HH:mm")
  });
  $messages.insertAdjacentHTML("beforeend", locationContent);
  autoscroll();
});

socket.on("roomData", ({ room, users }) => {
  const sidebarContent = Mustache.render(sidebarTemplate, {
    room,
    users
  });
  $sidebar.insertAdjacentHTML("beforeend", sidebarContent);
});

$locationButton.addEventListener("click", () => {
  if (!navigator.geolocation) {
    return alert("Geolocation is not supported by your browser");
  }

  $locationButton.setAttribute("disabled", "disabled");
  navigator.geolocation.getCurrentPosition(position => {
    socket.emit(
      "sendLocation",
      {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      },
      () => {
        $locationButton.removeAttribute("disabled");
        console.log("Location shared !");
      }
    );
  });
});

socket.emit("join", { username, room }, error => {
  if (error) {
    alert(error);
    location.href = "/";
  }
});
