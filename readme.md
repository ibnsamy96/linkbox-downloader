<div align='center' >

![linkbox-downloader logo](https://raw.githubusercontent.com/ibnsamy96/linkbox-downloader/main/logo.jpg)

# LinkBox-Downloader

Unofficial cli-utility for downloading files and folders from linkbox.to  
<i>|-- It's better to use proxies for you IP protection, check the utility configurations. --|</i>

</div>

## About LinkBox

[LinkBox](https://www.linkbox.to) is a file hosting and sharing website that allows users to upload and download files. It is commonly used to share large files that are too big to be sent via email. Linkbox provides users with a link to their uploaded files, which they can share with others.

## Prerequisites

Before using linkbox-downloader, please ensure that you have the following:

- Node.js v18 or later installed on your system. You can check your Node.js version by running the command `node --version`.
- An active internet connection.

## Installation

You can install the utility globally by running the following command:

```shell
npm install -g @ibnsamy96/linkbox-downloader
```

## Usage

To use the LBX Downloader, open a terminal or command prompt and type `lbx-downloader`.  
Follow the displayed instructions by entering the desired directory link to download.  
By default, the downloads location is `%userprofile%\linkbox-downloader\downloads` but you can change it in the utility configurations.

### Options

- `-o, --open` - open the downloads folder
- `-d, --dev` - start the utility in dev-mode
- `-c, --configs` - update the utility configurations
- `-h, --help` - display help information
- `-v, --version` - display version information

## Demo

![linkbox-downloader demo](https://raw.githubusercontent.com/ibnsamy96/linkbox-downloader/main/demo.gif)

## License

This project is licensed under the MIT License - see the [LICENSE](https://choosealicense.com/licenses/mit/) for details.
