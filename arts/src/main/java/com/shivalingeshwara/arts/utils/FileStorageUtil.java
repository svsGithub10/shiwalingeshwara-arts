package com.shivalingeshwara.arts.utils;

import java.io.File;
import java.time.LocalDate;
import java.time.format.TextStyle;
import java.util.Locale;

public class FileStorageUtil {

    public static String getMonthFolder(){

        LocalDate now = LocalDate.now();

        String month = now.getMonth()
                .getDisplayName(TextStyle.SHORT, Locale.ENGLISH)
                .toLowerCase();

        return month + "-" + now.getYear(); // mar-2026
    }

    public static String createFolder(String base){

        String folder = base + "/" + getMonthFolder();

        File f = new File(folder);

        if(!f.exists()){
            f.mkdirs();
        }

        return folder;
    }
}