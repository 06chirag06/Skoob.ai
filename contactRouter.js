const contactRouter = require("express").Router();
const { Contacts } = require("./contact");
const { Op } = require("sequelize");

const removeDuplicates = (data) =>
  data.filter((value, index) => data.indexOf(value) === index);

// Find contact by phone number
const findByPhoneNumber = async (phoneNumber) =>
  await Contacts.findAll({ where: { phoneNumber: phoneNumber } });

// Find contact by email
const findByEmail = async (email) =>
  await Contacts.findAll({ where: { email: email } });

// Find contact by email and phone number
const findByEmailAndPhoneNumber = async (emails, phoneNumbers) =>
  await Contacts.findAll({
    where: {
      [Op.or]: [{ email: emails }, { phoneNumber: phoneNumbers }],
    },
  });

const updateContact = async (data) =>
  (response = await Contacts.update(data, {
    where: {
      id: data.dataValues.id,
    },
  }));

const findByEmailsPhoneNumbersAndId = async (emails, phoneNumbers, id) =>
  await Contacts.findAll({
    where: {
      [Op.or]: [
        { email: emails },
        { phoneNumber: phoneNumbers },
        { linkedId: id },
      ],
    },
  });

// Identify order
const identifyOrder = async (req, res) => {
  const { phoneNumber, email } = req.body;

  // Check if phone number or email is provided
  if (!phoneNumber && !email) {
    return res.status(400).send("Phone number or email must be provided.");
  }

  let linkPrecedence = "secondary";
  let contacts = null;
  try {
    // Find contacts by email and phone number
    if (phoneNumber && email) {
      contacts = await findByEmailAndPhoneNumber(email, phoneNumber);
      // console.log(contacts);
      if (contacts === null) linkPrecedence = "primary";

      // Find contacts by phone number
    } else if (!phoneNumber) {
      contacts = await findByEmail(email);
      // console.log(contacts);
      if (contacts === null) linkPrecedence = "primary";

      // Find contacts by email
    } else if (!email) {
      contacts = await findByPhoneNumber(phoneNumber);
      // console.log(contacts);
      if (contacts === null) linkPrecedence = "primary";
    }

    let primaryContactId = null;
    let emails = [];
    let phoneNumbers = [];
    let secondaryContactIds = [];

    if (linkPrecedence !== "primary") {
      contacts.forEach((contact) => {
        if (contact.linkPrecedence === "primary") {
          primaryContactId = contact.id;
          emails = [contact.email, ...emails];
          phoneNumbers = [contact.phoneNumber, ...phoneNumbers];
        } else {
          secondaryContactIds = [...secondaryContactIds, contact.id];
          emails = [...emails, contact.email];
          phoneNumbers = [...phoneNumbers, contact.phoneNumber];
        }
      });

      emails = removeDuplicates(emails);
      phoneNumbers = removeDuplicates(phoneNumbers);
      contacts = await findByEmailsPhoneNumbersAndId(
        emails,
        phoneNumbers,
        primaryContactId
      );
      primaryContactId = null;
      secondaryContactIds = [];

      contacts.forEach((contact) => {
        if (contact.linkPrecedence === "primary") {
          if (primaryContactId === null) {
            primaryContactId = contact.id;
            emails = [contact.email, ...emails];
            phoneNumbers = [contact.phoneNumber, ...phoneNumbers];
          } else {
            let data = { ...contact };
            data.linkPrecedence = "secondary";
            data.linkedId = primaryContactId;
            data.updatedAt = Date.now();
            console.log(data.dataValues.id);
            updateContact(data);
            secondaryContactIds = [...secondaryContactIds, contact.id];
            emails = [...emails, contact.email];
            phoneNumbers = [...phoneNumbers, contact.phoneNumber];
          }
        } else {
          secondaryContactIds = [...secondaryContactIds, contact.id];
          emails = [...emails, contact.email];
          phoneNumbers = [...phoneNumbers, contact.phoneNumber];
        }
      });
    }

    if (
      email != null &&
      phoneNumber != null &&
      (!emails.includes(email) || !phoneNumbers.includes(phoneNumber))
    ) {
      const currDate = Date.now();
      const data = {
        phoneNumber: phoneNumber,
        email: email,
        linkedId: contacts[0].id,
        linkPrecedence: linkPrecedence,
        createdAt: currDate,
        updatedAt: currDate,
      };

      const newContact = await Contacts.create(data);

      emails = [...emails, data.email];
      phoneNumbers = [...phoneNumbers, data.phoneNumber];
      secondaryContactIds = [...secondaryContactIds, newContact.id];
    }

    phoneNumbers = removeDuplicates(phoneNumbers);
    emails = removeDuplicates(emails);
    secondaryContactIds = removeDuplicates(secondaryContactIds);
    res.status(200).json({
      contact: {
        primaryContactId: primaryContactId,
        emails: emails,
        phoneNumbers: phoneNumbers,
        secondartContactIds: secondaryContactIds,
      },
      // contacts,
    });
  } catch (err) {
    res.status(500).json(err);
  }
};

// Router to identify router
contactRouter.post("/identify", identifyOrder);

module.exports = contactRouter;
