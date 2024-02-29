const contactRouter = require("express").Router();
const { Contacts } = require("./contact");
const { Op } = require("sequelize");

const removeDuplicates = (data) =>
  data.filter((value, index) => data.indexOf(value) === index);

// Find contact by phone number
const findContactByPhoneNumber = async (phoneNumber) =>
  await Contacts.findAll({ where: { phoneNumber: phoneNumber } });

// Find contact by email
const findContactByEmail = async (email) =>
  await Contacts.findAll({ where: { email: email } });

// Find contact by email and phone number
const findContactByEmailAndPhoneNumber = async (emails, phoneNumbers) =>
  await Contacts.findAll({
    where: {
      [Op.or]: [{ email: emails }, { phoneNumber: phoneNumbers }],
    },
  });

// Update Contact
const updateContact = async (data) =>
  (response = await Contacts.update(data, {
    where: {
      id: data.dataValues.id,
    },
  }));

// Find Contact by Email, Phone Number and ID
const findContactByEmailsPhoneNumbersAndId = async (emails, phoneNumbers, id) =>
  await Contacts.findAll({
    where: {
      [Op.or]: [
        { email: emails },
        { phoneNumber: phoneNumbers },
        { linkedId: id },
      ],
    },
  });

// Updating the output as required
const updateContactInfo = (
  contacts,
  primaryContactId,
  emails,
  phoneNumbers,
  secondaryContactIds
) => {
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
        try {
          updateContact(data);
        } catch (err) {
          res.status(500).json({
            message: "Internal Server Error, Cannot Update Contact",
          });
        }
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
  return [primaryContactId, emails, phoneNumbers, secondaryContactIds];
};

// Identify order API with endpoint /identify
const identifyOrder = async (req, res) => {
  const { phoneNumber, email } = req.body;

  // Check if phone number or email is provided
  if (!phoneNumber && !email) {
    return res.status(400).send("Phone number or email must be provided.");
  }

  let linkPrecedence = "secondary";
  let contacts = null;

  // Find contacts using the data provided
  try {
    // Find contacts by email and phone number
    if (phoneNumber && email) {
      contacts = await findContactByEmailAndPhoneNumber(email, phoneNumber);
      if (contacts === null) linkPrecedence = "primary";

      // Find contacts by phone number
    } else if (!phoneNumber) {
      contacts = await findContactByEmail(email);
      if (contacts === null) linkPrecedence = "primary";

      // Find contacts by email
    } else if (!email) {
      contacts = await findContactByPhoneNumber(phoneNumber);
      if (contacts === null) linkPrecedence = "primary";
    }
  } catch (err) {
    res
      .status(500)
      .json({ message: "Internal Server Error, Cannot Find Contact" });
  }

  let primaryContactId = null;
  let emails = [];
  let phoneNumbers = [];
  let secondaryContactIds = [];

  if (linkPrecedence !== "primary") {
    [primaryContactId, emails, phoneNumbers, secondaryContactIds] =
      updateContactInfo(
        contacts,
        primaryContactId,
        emails,
        phoneNumbers,
        secondaryContactIds
      );

    emails = removeDuplicates(emails);
    phoneNumbers = removeDuplicates(phoneNumbers);

    // Find Contacts with email, phone number and linked id
    try {
      contacts = await findContactByEmailsPhoneNumbersAndId(
        emails,
        phoneNumbers,
        primaryContactId
      );
    } catch (err) {
      res
        .status(500)
        .json({ message: "Internal Server Error, Cannot Find Contact" });
    }
    primaryContactId = null;
    secondaryContactIds = [];

    [primaryContactId, emails, phoneNumbers, secondaryContactIds] =
      updateContactInfo(
        contacts,
        primaryContactId,
        emails,
        phoneNumbers,
        secondaryContactIds
      );
  }

  // Creating a new record if new information is received
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

    try {
      const newContact = await Contacts.create(data);
      console.log(newContact);
    } catch (err) {
      res
        .status(500)
        .json({ message: "Internal Server Error, Cannot Create Contact" });
    }
    emails = [...emails, data.email];
    phoneNumbers = [...phoneNumbers, data.phoneNumber];
    secondaryContactIds = [...secondaryContactIds, newContact.id];
  }

  phoneNumbers = removeDuplicates(phoneNumbers);
  emails = removeDuplicates(emails);
  secondaryContactIds = removeDuplicates(secondaryContactIds);

  // Sending the response back
  res.status(200).json({
    contact: {
      primaryContactId: primaryContactId,
      emails: emails,
      phoneNumbers: phoneNumbers,
      secondartContactIds: secondaryContactIds,
    },
    // contacts,
  });
  // } catch (err) {
  //   res.status(500).json(err);
  // }
};

// Router to identify router
contactRouter.post("/identify", identifyOrder);

module.exports = contactRouter;
