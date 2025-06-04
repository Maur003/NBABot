export const getContextualGreeting = (conversation) => {
  const count = conversation?.messages.length || 0;

  if (count === 1) return "👋 ¡Hola! Gracias por contactarme";
  if (count < 5) return "😊 Perfecto, te ayudo con la información:";

  return "🤝 Continuamos con tu consulta:";
};

export const delay = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
