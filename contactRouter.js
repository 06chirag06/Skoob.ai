const contactRouter = require("express").Router();

const { Contacts } = require("./user");

const identifyOrder = async (req, res) => {
  const { phoneNumber, email } = req.body;
  if (!phoneNumber && !email) {
    return res.status(400).send("Phone number or email must be provided.");
  }
  let linkPrecedence = "secondary";
  try {
    if (!phoneNumber) {
      const contact = await Contacts.findOne({ where: { email: email } });
      let linkPrecedence = "secondary";
      if (contact === null) {
        linkPrecedence = "primary";
      }
    }
    if (!email) {
      const contact = await Contacts.findOne({
        where: { phoneNumber: phoneNumber },
      });
      if (contact === null) {
        linkPrecedence = "primary";
      }
    }
    res.status(200).json({ linkPrecedence });
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

contactRouter.post("/identify", identifyOrder);

module.exports = contactRouter;
