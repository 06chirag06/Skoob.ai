const contactRouter = require("express").Router();
const { Contacts } = require("./contact");

const findByPhoneNumber = async (phoneNumber) =>
  await Contacts.findAll({ where: { phoneNumber: phoneNumber } });

const findByEmail = async (email) =>
  await Contacts.findAll({ where: { email: email } });

const findByEmailAndPhoneNumber = async (email, phoneNumber) =>
  await Contacts.findAll({
    where: { [Op.or]: [{ email: email }, { phoneNumber: phoneNumber }] },
  });

const identifyOrder = async (req, res) => {
  const { phoneNumber, email } = req.body;
  if (!phoneNumber && !email) {
    return res.status(400).send("Phone number or email must be provided.");
  }
  let linkPrecedence = "secondary";
  let contact = null;
  try {
    if (phoneNumber && email) {
      contact = await findByEmailAndPhoneNumber(email, phoneNumber);
      console.log(contact);
      if (contact === null) linkPrecedence = "primary";
    } else if (!phoneNumber) {
      contact = await findByEmail(email);
      console.log(contact);
      if (contact === null) linkPrecedence = "primary";
    } else if (!email) {
      contact = await findByPhoneNumber(phoneNumber);
      console.log(contact);
      if (contact === null) linkPrecedence = "primary";
    }
    const currDate = Date.now();
    const data = {
      phoneNumber: phoneNumber,
      email: email,
      linkedId: contact[0].id,
      linkPrecedence: linkPrecedence,
      createdAt: currDate,
      updatedAt: currDate,
    };
    const newContact = await Contacts.create(data);
    res.status(200).json({
      // contact: {
      //   primaryContactId: contact[0].id,
      //   emails: contact[0].email,
      //   phoneNumbers: contact[0].phoneNumber,
      //   secondartContactIds: contact[0].id,
      // },
      contact,
    });
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

contactRouter.post("/identify", identifyOrder);

module.exports = contactRouter;
