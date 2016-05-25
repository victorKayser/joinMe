SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='TRADITIONAL,ALLOW_INVALID_DATES';

CREATE SCHEMA IF NOT EXISTS `joinme` DEFAULT CHARACTER SET utf8 COLLATE utf8_general_ci ;
USE `joinme` ;

-- -----------------------------------------------------
-- Table `joinme`.`users`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `joinme`.`users` (
  `id_users` INT NOT NULL AUTO_INCREMENT,
  `phone_number` VARCHAR(10) NOT NULL,
  `password` VARCHAR(512) NULL,
  `date_subscribe` DATETIME NULL,
  `image_path` VARCHAR(255) NULL,
  PRIMARY KEY (`id_users`))
ENGINE = InnoDB;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
